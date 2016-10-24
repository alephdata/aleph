import os
import logging
import subprocess
from lxml import etree

from aleph.core import get_config
from aleph.util import make_tempdir, remove_tempdir
from aleph.ingest.tesseract import extract_image_data
from aleph.ingest.ingestor import IngestorException

log = logging.getLogger(__name__)


def element_size(el):
    return float(el.attrib.get('width', 1)) * float(el.attrib.get('height', 1))


def extract_page(path, page, languages):
    """Extract the contents of a single PDF page, using OCR if need be."""
    page_no = page.get('number')
    page_size = element_size(page)

    texts = []
    for text in page.findall('.//text'):
        content = text.xpath('string()').strip()
        if len(content):
            texts.append(content)

    for image in page.findall('.//image'):
        ratio = element_size(image) / page_size
        if len(texts) < 2 or ratio > 0.3:
            log.info("Using OCR for %r, p.%s", path, page_no)
            with open(image.get('src'), 'r') as fh:
                texts.append(extract_image_data(fh.read()))

    text = '\n'.join(texts).strip()
    log.debug("Extracted %d characters of text from %r, p.%s",
              len(text), path, page_no)
    return text


def extract_pdf(path, languages=None):
    """
    Extract content from a PDF file.

    This will convert the whole file to XML using `pdftohtml`, then run OCR
    on individual images within the file.
    """
    temp_dir = make_tempdir()
    try:
        out_file = os.path.join(temp_dir, 'pdf.xml')
        pdftohtml = get_config('PDFTOHTML_BIN')
        args = [pdftohtml, '-xml', '-hidden', '-q', '-c', '-nodrm',
                path, out_file]
        subprocess.call(args)

        if not os.path.exists(out_file):
            raise IngestorException("Could not parse PDF: %s" % path)

        with open(out_file, 'r') as fh:
            doc = etree.parse(fh)

        pages = []
        for page in doc.findall('./page'):
            pages.append(extract_page(path, page, languages))

        return {'pages': pages}
    finally:
        remove_tempdir(temp_dir)
