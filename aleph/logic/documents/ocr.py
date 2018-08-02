import logging
from PIL import Image
from io import BytesIO
from hashlib import sha1
from banal import ensure_list
from ingestors.services.interfaces import OCRService
from alephclient.services.ocr_pb2_grpc import RecognizeTextStub
from alephclient.services.ocr_pb2 import Image as RPCImage

from aleph import settings
from aleph.model import Cache
from aleph.services import ServiceClientMixin
from aleph.util import backoff

log = logging.getLogger(__name__)


class TextRecognizerService(OCRService, ServiceClientMixin):
    SERVICE = settings.OCR_SERVICE
    MAX_SIZE = (1024 * 1024 * 4) - 1024
    # MAX_SIZE = 10000

    def extract_text(self, data, languages=None):
        key = sha1(data).hexdigest()
        text = Cache.get_cache(key)
        if text is not None:
            log.info('OCR: %s chars cached', len(text))
            return text

        # log.info("Size: %s", len(data))
        data = self.ensure_size(data)
        if data is None:
            return

        for attempt in range(10):
            try:
                service = RecognizeTextStub(self.channel)
                languages = ensure_list(languages)
                image = RPCImage(data=data, languages=languages)
                response = service.Recognize(image)
                log.info('OCR: %s chars recognized', len(response.text))
                if response.text is not None:
                    Cache.set_cache(key, response.text)
                return response.text
            except self.Error as exc:
                log.exception("gRPC Error: %s", self.SERVICE)
                self.reset_channel()
                backoff(failures=attempt)

    def ensure_size(self, data):
        """This ensures that the max size of data sent to the service is 4Mi.
        This is primarily because gRPC has a built-in limit, but it also seems
        like good practice independently - reformatting broken image formats
        into clean PNGs before doing OCR."""

        # TODO: should we also throw out images smaller than maybe 1k?
        if len(data) < self.MAX_SIZE:
            return data

        try:
            image = Image.open(BytesIO(data))
            image.load()
            factor = 1.0
            while True:
                size = (int(image.width * factor), int(image.height * factor))
                resized = image.resize(size, Image.ANTIALIAS)

                with BytesIO() as output:
                    resized.save(output, format='png')
                    png_data = output.getvalue()

                # log.warn("Size: %s, %s", len(data), len(png_data))
                if len(png_data) < self.MAX_SIZE:
                    return png_data
                factor *= 0.9
        except Exception as err:
            log.error("Cannot open image, no OCR.")
            return None
