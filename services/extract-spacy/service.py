import time
import grpc
import spacy
import logging
from concurrent import futures

from alephclient.services.entityextract_pb2_grpc import add_EntityExtractServicer_to_server  # noqa
from alephclient.services.entityextract_pb2_grpc import EntityExtractServicer  # noqa
from alephclient.services.entityextract_pb2 import ExtractedEntity  # noqa

log = logging.getLogger('service')
LANGUAGES = ['en', 'de', 'es', 'pt', 'fr', 'it', 'nl']

# https://spacy.io/api/annotation#named-entities
LABELS = {
    'PERSON': 'PERSON',
    'NORP': 'ORGANIZATION',
    'ORG': 'ORGANIZATION',
    'GPE': 'LOCATION'
}


class SpacyServicer(EntityExtractServicer):
    MODELS = {}

    def Extract(self, request, context):
        text = request.text
        if text is None or not len(text.strip()):
            return

        entity_count = 0
        for language in request.languages:
            if language not in LANGUAGES:
                log.debug("Language not suported: %s", language)
                continue
            if language not in self.MODELS:
                log.info("Loading spaCy model: %s", language)
                self.MODELS[language] = spacy.load(language)
            nlp = self.MODELS.get(language)
            try:
                doc = nlp(request.text)
                for entity in doc.ents:
                    # log.info("Entity: %s, %s", entity.text, entity.label)
                    if len(entity.text) < 4 or len(entity.text) > 200:
                        continue
                    type_ = LABELS.get(entity.label_)
                    if type_ is None:
                        continue
                    length = entity.end_char - entity.start_char
                    entity_count += 1
                    yield ExtractedEntity(label=entity.text,
                                          offset=entity.start_char,
                                          length=length,
                                          type=type_)
            except Exception:
                log.exception("Cannot extract. Language: %s", language)
        log.info("Extract: extracted %s entities.", entity_count)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    add_EntityExtractServicer_to_server(SpacyServicer(), server)
    server.add_insecure_port('[::]:50000')
    server.start()
    log.info("Server started: [::]:50000")
    try:
        while True:
            time.sleep(84600)
    except KeyboardInterrupt:
        server.stop(60)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    logging.getLogger('polyglot').setLevel(logging.INFO)
    serve()
