import logging
from banal import ensure_list
from ingestors.services.interfaces import OCRService
from alephclient.services.ocr_pb2_grpc import RecognizeTextStub
from alephclient.services.ocr_pb2 import Image

from aleph import settings
from aleph.services import ServiceClientMixin

log = logging.getLogger(__name__)


class TextRecognizerService(OCRService, ServiceClientMixin):
    SERVICE = settings.OCR_SERVICE

    def extract_text(self, data, languages=None):
        try:
            service = RecognizeTextStub(self.channel)
            languages = ensure_list(languages)
            image = Image(data=data, languages=languages)
            response = service.Recognize(image)
            return response.text
        except self.Error as exc:
            log.exception("gRPC Error: %s", self.SERVICE)
            self.reset_channel()
