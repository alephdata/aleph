import time
import grpc
import logging
from concurrent import futures
from alephclient.services.entityextract_pb2_grpc import add_EntityExtractServicer_to_server  # noqa
from alephclient.services.entityextract_pb2_grpc import EntityExtractServicer  # noqa
from alephclient.services.entityextract_pb2 import ExtractedEntity, ExtractedEntitySet  # noqa

log = logging.getLogger(__name__)


class EntityExtractorServicer(EntityExtractServicer):

    def Extract(self, request_iterator, context):
        entities = ExtractedEntitySet(entities=[])
        # for label in labels:
        #     weight = labels[label]
        #     entity = entities.entities.add()
        #     entity.label = label
        #     entity.weight = weight
        #     entity.type = TYPES[types[label]]
        return entities


def serve(port):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=20))
    add_EntityExtractServicer_to_server(EntityExtractorServicer(), server)
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
    logging.getLogger('entityextractor').setLevel(logging.INFO)
    serve('[::]:50000')
