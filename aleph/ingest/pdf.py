import logging

from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import PDFPageAggregator
from pdfminer.layout import LAParams, LTTextBox, LTTextLine, LTFigure
# from pdfminer.layout import LTImage

from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser, PDFSyntaxError
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
    text_content = []
    for text_obj in _find_objects(layout._objs, (LTTextBox, LTTextLine)):
        text = text_obj.get_text()
        if text is None:
            continue
        text = text.strip()
        if len(text):
            text_content.append(text)

    text = '\n'.join(text_content)
    # if len(text) < 2:
    #     if len(list(_find_objects(layout._objs, LTImage))):
    #         log.debug("Defaulting to OCR: %r, pg. %s", path, page_no)
    #         text = _extract_image_page(path, page_no, languages)
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
        try:
            doc = PDFDocument(parser, '')
        except PDFSyntaxError as pse:
            if 'No /Root object!' in pse.message:
                log.info("Invalid PDF file: %r", path)
                return None
            raise

        result = {'pages': []}
        if len(doc.info):
            for k, v in doc.info[-1].items():
                k = k.lower().strip()
                if k != 'pages':
                    result[k] = string_value(v)

        if not doc.is_extractable:
            raise TypeError("PDF not extractable: %s", path)

        for i, page in enumerate(PDFPage.create_pages(doc)):
            text = None
            try:
                interpreter.process_page(page)
                layout = device.get_result()
                text = _convert_page(layout, path)
            except Exception as ex:
                log.warning("Failed to parse PDF page: %r", ex)

            if text is None or len(text) < 3:
                log.debug("Defaulting to OCR: %r, pg. %s", path, i + 1)
                text = _extract_image_page(path, i + 1, languages)
            result['pages'].append(text)
        device.close()
        return result
