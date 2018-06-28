import time
import logging
from concurrent import futures
from collections import Counter

import grpc
import spacy

from alephclient.services.entityextract_pb2_grpc import add_EntityExtractServicer_to_server  # noqa
from alephclient.services.entityextract_pb2_grpc import EntityExtractServicer  # noqa
from alephclient.services.entityextract_pb2 import ExtractedEntity, ExtractedEntitySet  # noqa

log = logging.getLogger('service')
LANGUAGES = ['en', 'de', 'es', 'pt', 'fr', 'it', 'nl']

# https://spacy.io/api/annotation#named-entities
LABELS = {
    'PERSON': ExtractedEntity.PERSON,
    'NORP': ExtractedEntity.ORGANIZATION,
    'ORG': ExtractedEntity.ORGANIZATION,
    'GPE': ExtractedEntity.LOCATION
}


class SpacyServicer(EntityExtractServicer):
    MODELS = {}

    def Extract(self, request_iterator, context):
        entities = ExtractedEntitySet(entities=[])
        labels = Counter()
        types = {}
        for text_obj in request_iterator:
            text = text_obj.text
            if text is None or not len(text.strip()):
                continue
            for language in text_obj.languages:
                if language not in LANGUAGES:
                    log.debug("Language not suported: %s", language)
                    continue
                if language not in self.MODELS:
                    log.info("Loading spaCy model: %s", language)
                    self.MODELS[language] = spacy.load(language)
                nlp = self.MODELS.get(language)
                try:
                    doc = nlp(text_obj.text)
                    for entity in doc.ents:
                        # log.info("Entity: %s, %s", entity.text, entity.label)
                        text = entity.text.strip()
                        if len(text) < 4 or len(text) > 100:
                            continue
                        if ' ' not in text:
                            continue
                        type_ = LABELS.get(entity.label_)
                        if type_ is None:
                            continue
                        labels[text] += 1
                        types[text] = type_
                except Exception:
                    log.exception("Cannot extract. Language: %s", language)
        for label in labels:
            weight = labels[label]
            entity = entities.entities.add()
            entity.label = label
            entity.weight = weight
            entity.type = types[label]
        return entities


def serve(port):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=20))
    add_EntityExtractServicer_to_server(SpacyServicer(), server)
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
    logging.getLogger('spacy').setLevel(logging.INFO)
    serve('[::]:50000')
