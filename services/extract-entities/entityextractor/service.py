# import os
import grpc
import time
import spacy
import logging
# from polyglot.text import Text
from concurrent import futures
from alephclient.services.entityextract_pb2_grpc import (
    add_EntityExtractServicer_to_server, EntityExtractServicer
)
from alephclient.services.entityextract_pb2 import ExtractedEntity

log = logging.getLogger('service')

# POLYGLOT_PATH = os.environ.get('POLYGLOT_DATA_PATH')
# POLYGLOT_NER_PATH = os.path.join(POLYGLOT_PATH, 'polyglot_data/ner2')
# POLYGLOT_LANGUAGES = os.listdir(POLYGLOT_NER_PATH)
# POLYGLOT_TYPES = {
#     'I-PER': ExtractedEntity.PERSON,
#     'I-ORG': ExtractedEntity.ORGANIZATION,
#     'I-LOC': ExtractedEntity.LOCATION
# }

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

    # def extract_polyglot(self, text):
    #     try:
    #         parsed = Text(text)
    #         lang = parsed.language
    #         if lang.confidence > 90:
    #             yield self.make_entity(lang.code,
    #                                    ExtractedEntity.LANGUAGE,
    #                                    0, len(text))
    #         if lang.code not in POLYGLOT_LANGUAGES:
    #             return
    #         for ent in parsed.entities:
    #             label = ' '.join(ent)
    #             type_ = POLYGLOT_TYPES.get(ent.tag)
    #             if type_ is not None and len(label):
    #                 entity = ExtractedEntity()
    #                 entity.text = label
    #                 entity.type = type_
    #                 entity.start = ent.start
    #                 entity.end = ent.end
    #                 yield entity
    #     except Exception as ex:
    #         log.exception("Polyglot failed")

    def extract_spacy(self, text):
        try:
            doc = self.spacy(text)
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
        except Exception:
            log.exception("spaCy failed")

    def Extract(self, request, context):
        # yield from self.extract_polyglot(request.text)
        yield from self.extract_spacy(request.text)


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
