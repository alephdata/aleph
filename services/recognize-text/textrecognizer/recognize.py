import time
import logging
from PIL import Image
from io import BytesIO
from languagecodes import list_to_alpha3 as alpha3
from tesserocr import PyTessBaseAPI, get_languages, PSM, OEM  # noqa

log = logging.getLogger(__name__)


class OCR(object):
    MAX_MODELS = 5
    DEFAULT_MODE = PSM.AUTO_OSD
    # DEFAULT_MODE = PSM.AUTO

    def __init__(self):
        # Tesseract language types:
        _, self.supported = get_languages()

    def language_list(self, languages):
        models = [c for c in alpha3(languages) if c in self.supported]
        if len(models) > self.MAX_MODELS:
            log.warning("Too many models, limit: %s", self.MAX_MODELS)
            models = models[:self.MAX_MODELS]
        models.append('eng')
        return '+'.join(sorted(set(models)))

    def configure_engine(self, languages, mode):
        # log.info("Configuring OCR engine (%s)", languages)
        if not hasattr(self, 'api') or self.api is None:
            self.api = PyTessBaseAPI(lang=languages, oem=OEM.LSTM_ONLY)
        if languages != self.api.GetInitLanguagesAsString():
            self.api.Init(lang=languages, oem=OEM.LSTM_ONLY)
        if mode != self.api.GetPageSegMode():
            self.api.SetPageSegMode(mode)
        return self.api

    def clear_engine(self):
        """Shut down tesseract and clear all memory."""
        try:
            self.api.End()
        except Exception:
            log.exception("Failed to shut down tesseract")
        self.api = None

    def extract_text(self, data, languages=None, mode=DEFAULT_MODE):
        """Extract text from a binary string of data."""
        try:
            image = Image.open(BytesIO(data))
            image.load()
        except Exception:
            log.exception("Cannot open image data using Pillow")
            return None

        try:
            languages = self.language_list(languages)
            api = self.configure_engine(languages, mode)
            # TODO: play with contrast and sharpening the images.
            start_time = time.time()
            api.SetImage(image)
            text = api.GetUTF8Text()
            confidence = api.MeanTextConf()
            end_time = time.time()
            duration = end_time - start_time
            log.info("[OCR] %s chars (w: %s, h: %s, l: %s, c: %s), took: %.5f",
                     len(text), image.width, image.height, languages,
                     confidence, duration)
            return text
        finally:
            api.Clear()
