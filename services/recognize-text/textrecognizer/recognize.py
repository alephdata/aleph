import time
import logging
import threading
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
        self.t = threading.local()

    def language_list(self, languages):
        models = [c for c in alpha3(languages) if c in self.supported]
        if len(models) > self.MAX_MODELS:
            log.warning("Too many models, limit: %s", self.MAX_MODELS)
            models = models[:self.MAX_MODELS]
        models.append('eng')
        return '+'.join(sorted(set(models)))

    def configure_engine(self, languages, mode):
        log.info("Configuring OCR engine (%s)", languages)
        if not hasattr(self.t, 'api'):
            self.t.api = PyTessBaseAPI(lang=languages, oem=OEM.LSTM_ONLY)
        if languages != self.t.api.GetInitLanguagesAsString():
            self.t.api.Init(lang=languages, oem=OEM.LSTM_ONLY)
        if mode != self.t.api.GetPageSegMode():
            self.t.api.SetPageSegMode(mode)
        return self.t.api

    def extract_text(self, data, languages=None, mode=DEFAULT_MODE):
        """Extract text from a binary string of data."""
        start_time = time.time()
        languages = self.language_list(languages)
        api = self.configure_engine(languages, mode)

        try:
            image = Image.open(BytesIO(data))
            # TODO: play with contrast and sharpening the images.
            api.SetImage(image)
            text = api.GetUTF8Text()
            confidence = api.MeanTextConf()
            end_time = time.time()
            duration = end_time - start_time
            log.info("%s chars (w: %s, h: %s, langs: %s, c: %s), took: %.5f",
                     len(text), image.width, image.height, languages,
                     confidence, duration)
            return text
        except Exception as ex:
            log.exception("Failed to OCR: %s", languages)
        finally:
            api.Clear()
