import grpc
import time
import logging
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
        self.recognizer = OCR()

    def Recognize(self, image, context):
        mode = self.MODES.get(image.mode, PSM.AUTO_OSD)
        text = self.recognizer.extract_text(image.data,
                                            languages=image.languages,
                                            mode=mode)
        return Text(text=text)


def serve(port):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=20))
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
