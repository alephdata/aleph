import logging

from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import PDFPageAggregator
from pdfminer.layout import LAParams, LTTextBox, LTTextLine, LTFigure
from pdfminer.layout import LTImage

from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser, PSEOF
from pdfminer.pdfdocument import PDFDocument

from aleph.core import get_config
from aleph.text import string_value
from aleph.ingest.tesseract import _extract_image_page

log = logging.getLogger(__name__)


def _find_objects(objects, cls):
    for lt_obj in objects:
        if isinstance(lt_obj, cls):
            yield lt_obj
        elif isinstance(lt_obj, LTFigure):
            for obj in _find_objects(lt_obj._objs, cls):
                yield obj


def _convert_page(interpreter, page, device, page_no, path, languages):
    # If this returns None or an empty string, it'll trigger OCR.
    text_content = []
    ocr_required = False
    try:
        interpreter.process_page(page)
        layout = device.get_result()

        for text_obj in _find_objects(layout._objs, (LTTextBox, LTTextLine)):
            text = text_obj.get_text()
            if text is None:
                continue
            text = text.strip()
            if len(text):
                text_content.append(text)

        # Generous try/catch because pdfminers image support is
        # horrible.
        page_area = float(layout.width * layout.height)
        for image_obj in _find_objects(layout._objs, LTImage):
            image_area = float(image_obj.width * image_obj.height)
            page_portion = image_area / page_area
            # Go for OCR if an image makes up more than 70% of the page.
            if page_portion > 0.7:
                ocr_required = True

    except Exception as ex:
        log.exception(ex)
        ocr_required = True

    if ocr_required and get_config("OCR_PDF_PAGES"):
        log.info("Using OCR for %r, p.%s", path, page_no)
        text_content.append(_extract_image_page(path, page_no, languages))

    text = '\n'.join(text_content)
    log.debug("Extracted %d characters of text from %r, p.%s",
              len(text), path, page_no)
    return text.strip()


def extract_pdf(path, languages=None):
    """
    Extract content from a PDF file.

    This will attempt to use pdfminer to extract textual content from
    each page. If none is found, it'll send the images through OCR.
    """
    fh = open(path, 'rb')
    result = {'pages': []}
    try:
        rsrcmgr = PDFResourceManager()
        laparams = LAParams()
        device = PDFPageAggregator(rsrcmgr, laparams=laparams)
        interpreter = PDFPageInterpreter(rsrcmgr, device)
        parser = PDFParser(fh)
        doc = PDFDocument(parser, '')

        if len(doc.info):
            for k, v in doc.info[-1].items():
                k = k.lower().strip()
                v = string_value(v)
                if k != 'pages' and v is not None and '<PDFObjRef:' not in v:
                    result[k] = string_value(v)

        for i, page in enumerate(PDFPage.create_pages(doc)):
            result['pages'].append(_convert_page(interpreter, page,
                                                 device, i + 1,
                                                 path, languages))
        device.close()
        return result
    except PSEOF as eof:
        log.info("Unexpected EOF: %r", eof)
        return result
    finally:
        fh.close()
