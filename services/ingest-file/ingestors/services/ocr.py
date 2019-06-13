import logging
from hashlib import sha1
from abc import ABC, abstractmethod
from servicelayer import env
from servicelayer.rpc import TextRecognizerService
from servicelayer.cache import get_redis, make_key
from servicelayer.settings import REDIS_LONG

log = logging.getLogger(__name__)


class OCRService(ABC):
    MIN_SIZE = 1024 * 2
    MAX_SIZE = (1024 * 1024 * 4) - 1024

    @classmethod
    def is_available(cls):
        return False

    @abstractmethod
    def _extract_text(self, data, languages=None):
        pass

    def extract_text(self, data, languages=None):
        if not self.MIN_SIZE < len(data) < self.MAX_SIZE:
            log.info('OCR: file size out of range (%d)', len(data))
            return None
        conn = get_redis()
        key = make_key('ocr', sha1(data).hexdigest())
        if conn.exists(key):
            text = conn.get(key)
            if text is not None:
                log.info('OCR: %s chars cached', len(text))
            return text

        text = self._extract_text(data, languages=languages)
        if text is not None:
            conn.set(key, text, ex=REDIS_LONG)
            log.info('OCR: %s chars (from %s bytes)',
                     len(text), len(data))
        return text


class ServiceOCRService(OCRService, TextRecognizerService):
    """Perform OCR using an RPC-based service. The service is available at
    github.com/alephdata/aleph-recognize-text, and built as a Docker image
    with the name: alephdata/aleph-recognize-text:latest."""

    @classmethod
    def is_available(cls):
        return cls.SERVICE is not None

    def _extract_text(self, data, languages=None):
        text = self.Recognize(data, languages=languages)
        if text is not None:
            return text.text or ''


class GoogleOCRService(OCRService):
    """Use Google's Vision API to perform OCR. This has very good quality
    but is quite expensive. For this reason, its use is controlled via a
    separate configuration variable, OCR_VISION_API, which must be set to
    'true'. To use the API, you must also have a service account JSON file
    under GOOGLE_APPLICATION_CREDENTIALS."""

    @classmethod
    def is_available(cls):
        try:
            from google.cloud.vision import ImageAnnotatorClient  # noqa
        except ImportError:
            return False
        return env.to_bool('OCR_VISION_API', False)

    def _extract_text(self, data, languages=None):
        from google.cloud.vision import types
        if not hasattr(self, 'client'):
            import google.auth
            from google.cloud.vision import ImageAnnotatorClient
            credentials, project_id = google.auth.default()
            self.client = ImageAnnotatorClient(credentials=credentials)
            log.info("Using Google Vision API. Charges apply.")
        image = types.Image(content=data)
        res = self.client.document_text_detection(image)
        return res.full_text_annotation.text
