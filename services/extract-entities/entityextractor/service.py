# import os
import grpc
import time
import spacy
import logging
from concurrent import futures
from alephclient.services.entityextract_pb2_grpc import (
    add_EntityExtractServicer_to_server, EntityExtractServicer
)
from alephclient.services.entityextract_pb2 import ExtractedEntity

log = logging.getLogger('service')

# https://spacy.io/api/annotation#named-entities
SPACY_TYPES = {
    'PER': ExtractedEntity.PERSON,
    'PERSON': ExtractedEntity.PERSON,
    'ORG': ExtractedEntity.ORGANIZATION,
    'LOC': ExtractedEntity.LOCATION,
    'GPE': ExtractedEntity.LOCATION
}
nlp = spacy.load('xx')


class EntityServicer(EntityExtractServicer):

    def Extract(self, request, context):
        try:
            doc = nlp(request.text)
            for ent in doc.ents:
                type_ = SPACY_TYPES.get(ent.label_)
                label = ent.text.strip()
                if type_ is not None and len(label):
                    entity = ExtractedEntity()
                    entity.text = label
                    entity.type = type_
                    entity.start = ent.start
                    entity.end = ent.end
                    yield entity
        except Exception as exc:
            log.exception("Failed to extract entities")
            context.set_details(str(exc))
            context.set_code(grpc.StatusCode.INTERNAL)


def serve(port):
    executor = futures.ThreadPoolExecutor(max_workers=10)
    server = grpc.server(executor)
    add_EntityExtractServicer_to_server(EntityServicer(), server)
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
    serve('[::]:50000')
