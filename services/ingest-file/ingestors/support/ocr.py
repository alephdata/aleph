import logging
from hashlib import sha1
from normality import stringify
from servicelayer import env
from servicelayer.rpc import TextRecognizerService

from ingestors import settings
from ingestors.support.cache import CacheSupport

log = logging.getLogger(__name__)


class OCRSupport(CacheSupport):
    MIN_SIZE = 1024 * 2
    MAX_SIZE = (1024 * 1024 * 4) - 1024

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
                settings._ocr_service = AlephOCRService()

        text = settings._ocr_service.extract_text(data, languages=languages)
        self.set_cache_value(key, text)
        if text is not None:
            log.info('OCR: %s chars (from %s bytes)',
                     len(text), len(data))
        return stringify(text)


class AlephOCRService(TextRecognizerService):
    """Perform OCR using an RPC-based service."""

    def extract_text(self, data, languages=None):
        if self.SERVICE is None:
            raise RuntimeError("No OCR service configured.")
        text = self.Recognize(data, languages=languages)
        if text is None:
            return ''
        return text.text or ''


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
        return env.to_bool('OCR_VISION_API', False)
