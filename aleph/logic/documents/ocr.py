import logging
from hashlib import sha1
from banal import ensure_list
from ingestors.services.util import OCRUtils
from ingestors.services.interfaces import OCRService
from alephclient.services.ocr_pb2_grpc import RecognizeTextStub
from alephclient.services.ocr_pb2 import Image

from aleph import settings
from aleph.model import Cache
from aleph.services import ServiceClientMixin
from aleph.util import backoff

log = logging.getLogger(__name__)


class TextRecognizerService(OCRService, ServiceClientMixin, OCRUtils):
    SERVICE = settings.OCR_SERVICE

    def extract_text(self, data, languages=None):
        key = sha1(data).hexdigest()
        text = Cache.get_cache(key)
        if text is not None:
            log.info('OCR: %s chars cached', len(text))
            return text

        data = self.ensure_size(data)
        if data is None:
            return

        for attempt in range(10):
            try:
                service = RecognizeTextStub(self.channel)
                languages = ensure_list(languages)
                image = Image(data=data, languages=languages)
                response = service.Recognize(image)
                log.info('OCR: %s chars recognized', len(response.text))
                if response.text is not None:
                    Cache.set_cache(key, response.text)
                return response.text
            except self.Error as exc:
                log.exception("gRPC Error: %s", self.SERVICE)
                self.reset_channel()
                backoff(failures=attempt)
