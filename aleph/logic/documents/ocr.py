import logging
from hashlib import sha1
from banal import ensure_list
from ingestors.services.util import OCRUtils
from ingestors.services.interfaces import OCRService
from alephclient.services.ocr_pb2_grpc import RecognizeTextStub
from alephclient.services.ocr_pb2 import Image
import google.auth
from google.cloud.vision import ImageAnnotatorClient
from google.cloud.vision import types

from aleph import settings
from aleph.core import kv
from aleph.services import ServiceClientMixin
from aleph.util import backoff, make_key, trace_function

log = logging.getLogger(__name__)


class TextRecognizerService(OCRService, ServiceClientMixin, OCRUtils):
    SERVICE = settings.OCR_SERVICE

    @trace_function(span_name="OCR")
    def extract_text(self, data, languages=None):
        key = make_key('ocr', sha1(data).hexdigest())
        text = kv.get(key)
        if text is not None:
            # log.info('%s chars cached', len(text))
            return text.decode('utf-8')

        data = self.ensure_size(data)
        if data is None:
            return

        for attempt in range(1000):
            try:
                service = RecognizeTextStub(self.channel)
                languages = ensure_list(languages)
                image = Image(data=data, languages=languages)
                response = service.Recognize(image)
                text = response.text or ''
                log.info('OCR: %s chars', len(text))
                kv.set(key, text.encode('utf-8'))
                return text
            except self.Error as e:
                if e.code() == self.Status.RESOURCE_EXHAUSTED:
                    continue
                log.warning("gRPC [%s]: %s", e.code(), e.details())
                backoff(failures=attempt)
                self.reset_channel()


class GoogleVisionService(OCRService, OCRUtils):

    def __init__(self):
        credentials, project_id = google.auth.default()
        self.client = ImageAnnotatorClient(credentials=credentials)
        log.info("Using Google Vision API. Charges apply.")

    @trace_function(span_name="GOOGLE_VISION_OCR")
    def extract_text(self, data, languages=None):
        key = make_key('ocr', sha1(data).hexdigest())
        text = kv.get(key)
        if text is not None:
            log.info('Vision API: %s chars cached', len(text))
            return text

        data = self.ensure_size(data)
        if data is not None:
            image = types.Image(content=data)
            res = self.client.document_text_detection(image)
            ann = res.full_text_annotation
            log.info('Vision API: %s chars recognized', len(ann.text))
            kv.set(key, ann.text)
            return ann.text
