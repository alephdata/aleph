import time
import logging
import multiprocessing
from concurrent import futures

import grpc
from alephclient.services.entityextract_pb2_grpc import add_EntityExtractServicer_to_server  # noqa
from alephclient.services.entityextract_pb2_grpc import EntityExtractServicer  # noqa
from alephclient.services.entityextract_pb2 import ExtractedEntity, ExtractedEntitySet  # noqa

from entityextractor.aggregate import EntityAggregator

log = logging.getLogger('entityextractor.service')


class EntityExtractorServicer(EntityExtractServicer):

    def Extract(self, request_iterator, context):
        entities = ExtractedEntitySet(entities=[])
        aggregator = EntityAggregator()
        for req in request_iterator:
            aggregator.extract(req.text, req.languages)

        for (label, category, weight) in aggregator.entities:
            entity = entities.entities.add()
            entity.label = label
            entity.type = category
            entity.weight = weight
        return entities


def serve(port):
    workers = multiprocessing.cpu_count()
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=workers))
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
    logging.getLogger('polyglot').setLevel(logging.INFO)
    serve('[::]:50000')
