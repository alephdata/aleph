import logging
import subprocess
try:
    from cStringIO import StringIO
except:
    from StringIO import StringIO

from PIL import Image
from PIL.Image import DecompressionBombWarning
from tesserwrap import Tesseract, PageSegMode

from aleph.core import get_config
from aleph.model import Cache
from aleph.ingest.ingestor import IngestorException
from aleph.metadata.reference import get_languages_iso3

# https://tesserwrap.readthedocs.io/en/latest/#
# https://pillow.readthedocs.io/en/3.0.x/reference/Image.html
log = logging.getLogger(__name__)


def extract_image_data(data, languages=None):
    """Extract text from a binary string of data."""
    tessdata_prefix = get_config('TESSDATA_PREFIX')
    if tessdata_prefix is None:
        raise IngestorException("TESSDATA_PREFIX is not set, OCR won't work.")
    languages = get_languages_iso3(languages)
    text = Cache.get_ocr(data, languages)
    if text is not None:
        return text
    try:
        img = Image.open(StringIO(data))
    except DecompressionBombWarning as dce:
        log.debug("Image too large: %", dce)
        return None
    except IOError as ioe:
        log.info("Unknown image format: %r", ioe)
        return None
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
    try:
        args = [pdftoppm, pdf_file, '-singlefile', '-gray', '-r', '400',
                '-aa', 'yes', '-f', str(page)]
        output = subprocess.check_output(args)
        return extract_image_data(output, languages=languages)
    except subprocess.CalledProcessError as cpe:
        log.info("Error in pdftoppm: %r", cpe)
        return None
