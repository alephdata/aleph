import os
import shutil
import logging
import subprocess
from tempfile import mkstemp, mkdtemp

from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser
from pdfminer.pdfdocument import PDFDocument
from cStringIO import StringIO

from aleph.core import app
from aleph.util import safe_text


log = logging.getLogger(__name__)

DEFAULT_LANGUAGES = ['deu', 'eng']


def extract_image(path, languages=DEFAULT_LANGUAGES):
    """ Use tesseract to extract text in the given ``languages`` from an
    image file. Tesseract should support a wide range of formats, including
    PNG, TIFF and JPG. """
    # TODO: find out how to keep tesseract running so it won't need to
    #       reload for each page.
    # TODO: play with contrast and sharpening the images.
    sysfd, page_dest = mkstemp()
    page_out = '%s.txt' % page_dest
    try:
        languages = '+'.join(languages)
        bin_path = app.config.get('TESSERACT_BIN', 'tesseract')
        args = [bin_path, path, page_dest, '-l', languages, '-psm', '1']
        subprocess.call(args)
        with open(page_out, 'rb') as fh:
            return fh.read()
    except Exception as ex:
        log.exception(ex)
        return ''
    finally:
        os.close(sysfd)
        if os.path.isfile(page_dest):
            os.unlink(page_dest)
        if os.path.isfile(page_out):
            os.unlink(page_out)


def extract_image_pdf(path, languages=DEFAULT_LANGUAGES):
    """ Split up a PDF into pages and process each page through tesseract. """
    file_name = os.path.basename(path)
    work_dir = mkdtemp()
    work_prefix = os.path.join(work_dir, file_name)
    try:
        bin_path = app.config.get('PDFTOPPM_BIN', 'pdftoppm')
        args = [bin_path, '-png', path, work_prefix]
        subprocess.call(args)
        for image_file in os.listdir(work_dir):
            image_path = os.path.join(work_dir, image_file)
            yield extract_image(image_path, languages=languages)
    except Exception as ex:
        log.exception(ex)
    finally:
        if os.path.isdir(work_dir):
            shutil.rmtree(work_dir)


def raw_pdf_convert(path):
    with open(path, 'rb') as fh:
        rsrcmgr = PDFResourceManager()
        laparams = LAParams()
        device = TextConverter(rsrcmgr, outfp=StringIO(), laparams=laparams)
        interpreter = PDFPageInterpreter(rsrcmgr, device)
        parser = PDFParser(fh)
        doc = PDFDocument(parser, '')
        pages = []
        if doc.is_extractable:
            for page in PDFPage.create_pages(doc):
                device.outfp.seek(0)
                device.outfp.truncate(0)
                interpreter.process_page(page)
                pages.append(device.outfp.getvalue())
        device.close()
        return doc.info.pop(), pages


def extract_pdf(path, languages=DEFAULT_LANGUAGES):
    """ Extract content from a PDF file. This will attempt to use PyPDF2
    to extract textual content first. If none is found, it'll send the file
    through OCR. """
    info, pages = raw_pdf_convert(path)
    data = {'pages': pages, 'ocr': False}
    for k, v in info.items():
        data[k.lower()] = safe_text(v)

    text = ''.join(data['pages']).strip()
    # FIXME: this should be smarter
    if not len(text):
        data['ocr'] = True
        for page in extract_image_pdf(path, languages=languages):
            data['pages'].append(page)
    return data


def document_to_pdf(path):
    """ OK, this is weird. Converting LibreOffice-supported documents to
    PDF to then use that extractor. """
    work_dir = mkdtemp()
    try:
        bin_path = app.config.get('SOFFICE_BIN', 'soffice')
        args = [bin_path, '--convert-to', 'pdf:writer_pdf_Export',
                '--outdir', work_dir,
                '--headless', path]
        subprocess.call(args)
        for out_file in os.listdir(work_dir):
            return os.path.join(work_dir, out_file)
    except Exception as ex:
        log.exception(ex)
