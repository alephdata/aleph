import grpc
import time
import logging
from concurrent import futures

from alephclient.services.ocr_pb2_grpc import (
    add_RecognizeTextServicer_to_server, RecognizeTextServicer
)
# from alephclient.services.ocr_pb2 import Image

log = logging.getLogger('service')


class OCRServicer(RecognizeTextServicer):

    def __init__(self):
        self.recognizer = None

    def Recognize(self, image, context):
        pass


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
    logging.getLogger('service').setLevel(logging.INFO)
    serve('[::]:50000')
