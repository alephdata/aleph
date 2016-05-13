import logging
import subprocess
try:
    from cStringIO import StringIO
except:
    from StringIO import StringIO

from PIL import Image
from tesserwrap import Tesseract, PageSegMode

from aleph.core import get_config
from aleph.model import Cache
from aleph.metadata.languages import get_iso3

# https://tesserwrap.readthedocs.org/en/latest/#
# https://pillow.readthedocs.org/en/3.0.x/reference/Image.html
log = logging.getLogger(__name__)


def extract_image_data(data, languages=None):
    """Extract text from a binary string of data."""
    tessdata_prefix = get_config('TESSDATA_PREFIX')
    if tessdata_prefix is None:
        raise ValueError('TESSDATA_PREFIX is not set, OCR will not work.')
    languages = get_iso3(languages)
    text = Cache.get_ocr(data, languages)
    if text is not None:
        return text
    try:
        img = Image.open(StringIO(data))
    except Exception as ex:
        log.debug('Failed to parse image internally: %r', ex)
        return ''

    # TODO: play with contrast and sharpening the images.
    extractor = Tesseract(tessdata_prefix, lang=languages)
    extractor.set_page_seg_mode(PageSegMode.PSM_AUTO_OSD)
    text = extractor.ocr_image(img)
    log.debug('OCR done: %s, %s characters extracted',
              languages, len(text))
    Cache.set_ocr(data, languages, text)
    return text


def _extract_image_page(pdf_file, page, languages=None):
    # This is a somewhat hacky way of working around some of the formats
    # and compression mechanisms not supported in pdfminer. It will
    # generate an image based on the given page in the PDF and then OCR
    # that.
    pdftoppm = get_config('PDFTOPPM_BIN')
    args = [pdftoppm, pdf_file, '-singlefile', '-gray', '-f', str(page)]
    output = subprocess.check_output(args)
    return extract_image_data(output, languages=languages)
