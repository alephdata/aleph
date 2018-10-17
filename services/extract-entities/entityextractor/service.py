import os
import grpc
import time
import spacy
import logging
from polyglot.text import Text
from concurrent import futures
from alephclient.services.entityextract_pb2_grpc import (
    add_EntityExtractServicer_to_server, EntityExtractServicer
)
from alephclient.services.entityextract_pb2 import ExtractedEntity

log = logging.getLogger('service')

POLYGLOT_PATH = os.environ.get('POLYGLOT_DATA_PATH')
POLYGLOT_NER_PATH = os.path.join(POLYGLOT_PATH, 'polyglot_data/ner2')
POLYGLOT_LANGUAGES = os.listdir(POLYGLOT_NER_PATH)
POLYGLOT_TYPES = {
    'I-PER': ExtractedEntity.PERSON,
    'I-ORG': ExtractedEntity.ORGANIZATION,
    'I-LOC': ExtractedEntity.LOCATION
}

# https://spacy.io/api/annotation#named-entities
SPACY_TYPES = {
    'PER': ExtractedEntity.PERSON,
    'PERSON': ExtractedEntity.PERSON,
    'ORG': ExtractedEntity.ORGANIZATION,
    'LOC': ExtractedEntity.LOCATION,
    'GPE': ExtractedEntity.LOCATION
}


class EntityServicer(EntityExtractServicer):

    def __init__(self):
        log.info("Loading spaCy model xx...")
        self.spacy = spacy.load('xx')

    def extract_polyglot(self, text):
        try:
            parsed = Text(text)
            lang = parsed.language
            if lang.confidence > 90:
                yield self.make_entity(lang.code,
                                       ExtractedEntity.LANGUAGE,
                                       0, len(text))
            if lang.code not in POLYGLOT_LANGUAGES:
                return
            for entity in parsed.entities:
                label = ' '.join(entity)
                type_ = POLYGLOT_TYPES.get(entity.tag)
                if type_ is not None:
                    yield self.make_entity(label, type_,
                                           entity.start,
                                           entity.end)
        except Exception as ex:
            log.exception("Polyglot failed")

    def extract_spacy(self, text):
        try:
            doc = self.spacy(text)
            for ent in doc.ents:
                type_ = SPACY_TYPES.get(ent.label_)
                if type_ is not None:
                    yield self.make_entity(ent.text, type_, ent.start, ent.end)
        except Exception:
            log.exception("spaCy failed")

    def make_entity(self, text, type_, start, end):
        text = text.strip()
        if not len(text):
            return
        entity = ExtractedEntity()
        entity.text = text
        entity.type = type_
        entity.start = start
        entity.end = end
        return entity

    def extract_all(self, text):
        yield from self.extract_polyglot(text)
        yield from self.extract_spacy(text)

    def Extract(self, request, context):
        for result in self.extract_all(request.text):
            if result is None:
                continue
            yield result


def serve(port):
    executor = futures.ThreadPoolExecutor(max_workers=3)
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
    logging.getLogger('polyglot').setLevel(logging.WARNING)
    serve('[::]:50000')
