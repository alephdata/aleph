import logging
try:
    from cStringIO import StringIO
except:
    from StringIO import StringIO

from PIL import Image
from PIL.Image import DecompressionBombWarning
from tesserwrap import Tesseract, PageSegMode
from pycountry import languages

from aleph.core import get_config
from aleph.model import Cache
from aleph.util import ensure_list
from aleph.ingest.ingestor import IngestorException

# https://tesserwrap.readthedocs.io/en/latest/#
# https://pillow.readthedocs.io/en/3.0.x/reference/Image.html
log = logging.getLogger(__name__)


def get_languages_iso3(codes):
    """Turn (pre-set) ISO2 language codes into ISO3 codes."""
    supported = []
    for lang in ensure_list(codes):
        if lang is None or len(lang.strip()) not in [2, 3]:
            continue
        lang = lang.lower().strip()
        if len(lang) == 2:
            try:
                c = languages.get(alpha_2=lang)
                lang = c.alpha_3
            except KeyError as ke:
                log.exception(ke)
                continue
        supported.append(lang)

    # if not len(supported):
    supported.append('eng')
    return '+'.join(sorted(set(supported)))


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
    extractor.set_image(img)
    extractor.set_page_seg_mode(PageSegMode.PSM_AUTO_OSD)
    text = extractor.get_text() or ''
    text = text.decode(encoding="UTF-8")
    # extractor.clear()
    log.debug('OCR done: %s, %s characters extracted',
              languages, len(text))
    Cache.set_ocr(data, languages, text)
    return text
