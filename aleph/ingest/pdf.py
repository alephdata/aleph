import logging

from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import PDFPageAggregator
from pdfminer.layout import LAParams, LTTextBox, LTTextLine, LTFigure
from pdfminer.layout import LTImage

from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser
from pdfminer.pdfdocument import PDFDocument

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


def _convert_page(layout, path):
    # If this returns None or an empty string, it'll trigger OCR.
    text_content = []

    try:
        # Generous try/catch because pdfminers image support is
        # horrible.
        page_area = float(layout.width * layout.height)
        for image_obj in _find_objects(layout._objs, LTImage):
            image_area = float(image_obj.width * image_obj.height)
            page_portion = image_area / page_area
            # Go for OCR if an image makes up more than 70% of the page.
            if page_portion > 0.7:
                return None
    except Exception as ex:
        log.exception(ex)

    for text_obj in _find_objects(layout._objs, (LTTextBox, LTTextLine)):
        text = text_obj.get_text()
        if text is None:
            continue
        text = text.strip()
        if len(text):
            text_content.append(text)

    text = '\n'.join(text_content)
    return text.strip()


def extract_pdf(path, languages=None):
    """
    Extract content from a PDF file.

    This will attempt to use pdfminer to extract textual content from
    each page. If none is found, it'll send the images through OCR.
    """
    with open(path, 'rb') as fh:
        rsrcmgr = PDFResourceManager()
        laparams = LAParams()
        device = PDFPageAggregator(rsrcmgr, laparams=laparams)
        interpreter = PDFPageInterpreter(rsrcmgr, device)
        parser = PDFParser(fh)
        doc = PDFDocument(parser, '')

        result = {'pages': []}
        if len(doc.info):
            for k, v in doc.info[-1].items():
                k = k.lower().strip()
                if k != 'pages':
                    result[k] = string_value(v)

        for i, page in enumerate(PDFPage.create_pages(doc)):
            text = None
            try:
                interpreter.process_page(page)
                layout = device.get_result()
                text = _convert_page(layout, path)
            except Exception as ex:
                log.warning("Failed to parse PDF page: %r", ex)

            if text is None or len(text) < 3:
                log.info("OCR: %r, pg. %s", path, i + 1)
                text = _extract_image_page(path, i + 1, languages)
            result['pages'].append(text)
        device.close()
        return result
