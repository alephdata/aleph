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

log = logging.getLogger('entityextractor')

# https://spacy.io/api/annotation#named-entities
SPACY_TYPES = {
    'PER': ExtractedEntity.PERSON,
    'PERSON': ExtractedEntity.PERSON,
    'ORG': ExtractedEntity.ORGANIZATION,
    'LOC': ExtractedEntity.LOCATION,
    'GPE': ExtractedEntity.LOCATION
}


class EntityServicer(EntityExtractServicer):

    def __init__(self, nlp):
        self.nlp = nlp

    def Extract(self, request, context):
        try:
            doc = self.nlp(request.text)
            count = 0
            for ent in doc.ents:
                type_ = SPACY_TYPES.get(ent.label_)
                label = ent.text.strip()
                if type_ is not None and len(label):
                    count += 1
                    entity = ExtractedEntity()
                    entity.text = label
                    entity.type = type_
                    entity.start = ent.start
                    entity.end = ent.end
                    yield entity
            log.info("[NER]: %d entities from %d chars",
                     count, len(request.text))
        except Exception as exc:
            log.exception("Failed to extract entities")
            context.abort(grpc.StatusCode.INTERNAL, str(exc))


def serve(port):
    executor = futures.ThreadPoolExecutor(max_workers=3)
    server = grpc.server(executor)
    log.info("Loading spaCy model...")
    nlp = spacy.load('xx')
    log.info("Model loaded.")
    servicer = EntityServicer(nlp)
    add_EntityExtractServicer_to_server(servicer, server)
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
