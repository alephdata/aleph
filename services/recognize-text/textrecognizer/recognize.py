import logging
from PIL import Image
from io import BytesIO
from languagecodes import list_to_alpha3 as alpha3
from tesserocr import PyTessBaseAPI, get_languages, PSM, OEM  # noqa

log = logging.getLogger(__name__)


class OCR(object):
    MAX_MODELS = 5
    MIN_WIDTH = 10
    MIN_HEIGHT = 10

    def __init__(self):
        # Tesseract language types:
        _, self.supported = get_languages()
        self.reset_engine('eng')

    def language_list(self, languages):
        models = [c for c in alpha3(languages) if c in self.supported]
        if len(models) > self.MAX_MODELS:
            log.warning("Too many models, limit: %s", self.MAX_MODELS)
            models = models[:self.MAX_MODELS]
        models.append('eng')
        return '+'.join(sorted(set(models)))

    def reset_engine(self, languages):
        if hasattr(self, 'api'):
            self.api.Clear()
            self.api.End()
        self.api = PyTessBaseAPI(lang=languages, oem=OEM.LSTM_ONLY)

    def extract_text(self, data, languages=None, mode=PSM.AUTO_OSD):
        """Extract text from a binary string of data."""
        languages = self.language_list(languages)
        if languages != self.api.GetInitLanguagesAsString():
            self.reset_engine(languages)

        try:
            image = Image.open(BytesIO(data))
            # TODO: play with contrast and sharpening the images.
            if image.width <= self.MIN_WIDTH:
                return
            if image.height <= self.MIN_HEIGHT:
                return

            if mode != self.api.GetPageSegMode():
                self.api.SetPageSegMode(mode)

            self.api.SetImage(image)
            text = self.api.GetUTF8Text()
            confidence = self.api.MeanTextConf()
            log.info("%s chars (w: %s, h: %s, langs: %s, confidence: %s)",
                     len(text), image.width, image.height, languages,
                     confidence)
            return text
        except Exception as ex:
            log.exception("Failed to OCR: %s", languages)
        finally:
            self.api.Clear()
