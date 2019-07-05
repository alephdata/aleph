import time
import logging
import threading
from hashlib import sha1
from normality import stringify
from PIL import Image
from io import BytesIO
from languagecodes import list_to_alpha3 as alpha3

from ingestors import settings
from ingestors.support.cache import CacheSupport
from ingestors.util import temp_locale

log = logging.getLogger(__name__)
TESSERACT_LOCALE = 'C'


class OCRSupport(CacheSupport):
    MIN_SIZE = 1024 * 2
    MAX_SIZE = (1024 * 1024 * 30) - 1024

    def extract_ocr_text(self, data, languages=None):
        if not self.MIN_SIZE < len(data) < self.MAX_SIZE:
            log.info('OCR: file size out of range (%d)', len(data))
            return None

        languages = sorted(set(languages or []))
        data_key = sha1(data).hexdigest()
        key = self.cache_key('ocr', data_key, *languages)
        text = self.get_cache_value(key)
        if text is not None:
            log.info('OCR: %s chars cached', len(text))
            return stringify(text)

        if not hasattr(settings, '_ocr_service'):
            if GoogleOCRService.is_available():
                settings._ocr_service = GoogleOCRService()
            else:
                settings._ocr_service = LocalOCRService()

        text = settings._ocr_service.extract_text(data, languages=languages)
        # text = ''
        self.set_cache_value(key, text)
        if text is not None:
            log.info('OCR: %s chars (from %s bytes)',
                     len(text), len(data))
        return stringify(text)


class LocalOCRService(object):
    """Perform OCR using an RPC-based service."""
    MAX_MODELS = 4

    def __init__(self):
        if not hasattr(settings, 'ocr_supported'):
            with temp_locale(TESSERACT_LOCALE):
                # Tesseract language types:
                from tesserocr import get_languages
                _, settings.ocr_supported = get_languages()
        self.tl = threading.local()

    def language_list(self, languages):
        models = [c for c in alpha3(languages) if c in settings.ocr_supported]
        if len(models) > self.MAX_MODELS:
            log.warning("Too many models, limit: %s", self.MAX_MODELS)
            models = models[:self.MAX_MODELS]
        models.append('eng')
        return '+'.join(sorted(set(models)))

    def configure_engine(self, languages):
        if not hasattr(self.tl, 'api') or self.tl.api is None:            
            from tesserocr import PyTessBaseAPI, PSM, OEM
            log.info("Configuring OCR engine (%s)", languages)
            self.tl.api = PyTessBaseAPI(lang=languages,
                                        oem=OEM.LSTM_ONLY,
                                        psm=PSM.AUTO_OSD)
        if languages != self.tl.api.GetInitLanguagesAsString():
            log.info("Re-initialising OCR engine (%s)", languages)
            self.tl.api.Init(lang=languages, oem=OEM.LSTM_ONLY)
        return self.tl.api

    def extract_text(self, data, languages=None):
        """Extract text from a binary string of data."""
        try:
            image = Image.open(BytesIO(data))
            image.load()
        except Exception:
            log.exception("Cannot open image data using Pillow")
            return None

        with temp_locale(TESSERACT_LOCALE):
            try:
                languages = self.language_list(languages)
                api = self.configure_engine(languages)
                # TODO: play with contrast and sharpening the images.
                start_time = time.time()
                api.SetImage(image)
                text = api.GetUTF8Text()
                confidence = api.MeanTextConf()
                end_time = time.time()
                duration = end_time - start_time
                log.info("(w: %s, h: %s, l: %s, c: %s), took: %.5f",
                         image.width, image.height, languages,
                         confidence, duration)
                return text
            finally:
                api.Clear()


class GoogleOCRService(object):
    """Use Google's Vision API to perform OCR. This has very good quality
    but is quite expensive. For this reason, its use is controlled via a
    separate configuration variable, OCR_VISION_API, which must be set to
    'true'. To use the API, you must also have a service account JSON file
    under GOOGLE_APPLICATION_CREDENTIALS."""

    def __init__(self):
        import google.auth
        from google.cloud.vision import ImageAnnotatorClient
        credentials, project_id = google.auth.default()
        self.client = ImageAnnotatorClient(credentials=credentials)
        log.info("Using Google Vision API. Charges apply.")

    def extract_text(self, data, languages=None):
        from google.cloud.vision import types
        image = types.Image(content=data)
        res = self.client.document_text_detection(image)
        return res.full_text_annotation.text or ''

    @classmethod
    def is_available(cls):
        try:
            from google.cloud.vision import ImageAnnotatorClient  # noqa
        except ImportError:
            return False
        return settings.OCR_VISION_API
