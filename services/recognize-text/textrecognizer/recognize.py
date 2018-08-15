import logging
from io import BytesIO
from PIL import Image
from threading import local
from tesserocr import PyTessBaseAPI, PSM, OEM  # noqa

from textrecognizer.languages import get_languages

log = logging.getLogger(__name__)


class OCR(object):
    MIN_WIDTH = 10
    MIN_HEIGHT = 10

    def __init__(self):
        self.thread = local()

    def get_api(self, languages):
        if not hasattr(self.thread, 'api'):
            # api = PyTessBaseAPI(oem=OEM.TESSERACT_LSTM_COMBINED,
            #                     path=PATH,
            #                     lang=languages)
            self.thread.api = PyTessBaseAPI(lang=languages)
        elif languages != self.thread.api.GetInitLanguagesAsString():
            self.thread.api.Init(lang=languages)
        return self.thread.api

    def extract_text(self, data, languages=None, mode=PSM.AUTO_OSD):
        """Extract text from a binary string of data."""
        languages = get_languages(languages)
        api = self.get_api(languages)
        try:
            image = Image.open(BytesIO(data))
            # TODO: play with contrast and sharpening the images.
            if image.width <= self.MIN_WIDTH:
                return
            if image.height <= self.MIN_HEIGHT:
                return

            if mode != api.GetPageSegMode():
                api.SetPageSegMode(mode)

            api.SetImage(image)
            text = api.GetUTF8Text()
            confidence = api.MeanTextConf()
            log.info("%s chars (w: %s, h: %s, langs: %s, confidence: %s)",
                     len(text), image.width, image.height, languages,
                     confidence)
            return text
        except Exception as ex:
            log.exception("Failed to OCR: %s", languages)
        finally:
            api.Clear()
