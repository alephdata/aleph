import os
import logging
from io import BytesIO
from PIL import Image
from threading import local
from tesserocr import PyTessBaseAPI, PSM, OEM  # noqa

from textrecognizer.languages import get_languages

log = logging.getLogger(__name__)
PATH = '/usr/share/tesseract-ocr/'
PATH = os.environ.get('TESSDATA_PREFIX', PATH)


class OCR(object):

    def __init__(self):
        self.thread = local()

    def get_api(self, languages):
        if not hasattr(self.thread, 'api'):
            # api = PyTessBaseAPI(oem=OEM.TESSERACT_LSTM_COMBINED,
            #                     path=PATH,
            #                     lang=languages)
            api = PyTessBaseAPI(path=PATH, lang=languages)
            self.thread.api = api
        return self.thread.api

    def extract_text(self, data, languages=None, mode=PSM.AUTO_OSD):
        """Extract text from a binary string of data."""
        languages = get_languages(languages)
        log.info("Languages: %s", languages)
        api = self.get_api(languages)

        if languages != api.GetInitLanguagesAsString():
            api.Init(path=PATH, lang=languages)

        if mode != api.GetPageSegMode():
            api.SetPageSegMode(mode)

        try:
            image = Image.open(BytesIO(data))
            # TODO: play with contrast and sharpening the images.
            api.SetImage(image)
            return api.GetUTF8Text()
        except Exception as ex:
            log.exception("Failed to OCR: %s", languages)
            return None
        finally:
            api.Clear()
