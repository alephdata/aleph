import os
import logging
from io import BytesIO
from PIL import Image
from threading import local
from banal import ensure_list
from tesserocr import PyTessBaseAPI, PSM  # noqa

log = logging.getLogger(__name__)


class OCR(object):

    def __init__(self, prefix=None):
        self.prefix = '/usr/share/tesseract-ocr/'
        self.prefix = os.environ.get('TESSDATA_PREFIX', self.prefix)
        self.prefix = prefix or self.prefix
        self.thread = local()

    def normalize_language(self, language):
        """Turn some ISO2 language codes into ISO3 codes."""
        # tesserocr.get_languages()
        if language is None:
            return set()
        lang = language.lower().strip()
        matches = set()
        for (code, aliases) in self.LANGUAGES.items():
            if lang == code or lang in aliases:
                matches.add(code)
        return matches

    def get_api(self, languages):
        if not hasattr(self.thread, 'api'):
            api = PyTessBaseAPI(path=self.prefix, lang=languages)
            api.SetPageSegMode(PSM.AUTO_OSD)
            self.thread.api = api
        return self.thread.api

    def extract_text(self, data, languages=None):
        """Extract text from a binary string of data."""
        codes = set(['eng'])
        for lang in ensure_list(codes):
            codes.update(self.normalize_language(lang))
        languages = '+'.join(sorted(codes))
        api = self.get_api(languages)

        if languages != api.GetInitLanguagesAsString():
            api.Init(path=self.prefix, lang=languages)

        try:
            # TODO: play with contrast and sharpening the images.
            image = Image.open(BytesIO(data))
            api.SetImage(image)
            return api.GetUTF8Text()
        except Exception as ex:
            log.warning("Failed to OCR: %s", ex)
            return None
        finally:
            api.Clear()
