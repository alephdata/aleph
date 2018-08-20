import grpc
import time
import logging
from threading import RLock
from concurrent import futures
from alephclient.services.ocr_pb2_grpc import (
    add_RecognizeTextServicer_to_server, RecognizeTextServicer
)
from alephclient.services.ocr_pb2 import Image
from alephclient.services.common_pb2 import Text

from textrecognizer.recognize import OCR, PSM

log = logging.getLogger('service')


class OCRServicer(RecognizeTextServicer):
    MODES = {
        Image.PAGE: PSM.AUTO_OSD,
        Image.WORD: PSM.SINGLE_WORD,
        Image.CHARACTER: PSM.SINGLE_CHAR
    }

    def __init__(self):
        self.lock = RLock()
        self.ocr = OCR()

    def Recognize(self, image, context):
        acquired = self.lock.acquire(blocking=False)
        if acquired is False:
            context.set_code(grpc.StatusCode.RESOURCE_EXHAUSTED)
            context.set_details('Engine is busy.')
            return Text()

        try:
            mode = self.MODES.get(image.mode, PSM.AUTO_OSD)
            text = self.ocr.extract_text(image.data, mode=mode,
                                         languages=image.languages)
            return Text(text=text)
        finally:
            self.lock.release()


def serve(port):
    options = [('grpc.max_receive_message_length', 10 * 1024 * 1024)]
    executor = futures.ThreadPoolExecutor(max_workers=5)
    server = grpc.server(executor, options=options)
    add_RecognizeTextServicer_to_server(OCRServicer(), server)
    server.add_insecure_port(port)
    server.start()
    log.info("Server started: %s", port)
    try:
        while True:
            time.sleep(84600)
    except KeyboardInterrupt:
        server.stop(60)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    logging.getLogger('PIL').setLevel(logging.INFO)
    serve('[::]:50000')
