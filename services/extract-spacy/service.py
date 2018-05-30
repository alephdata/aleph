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
                    text = entity.text.strip()
                    if len(text) < 4 or len(text) > 100:
                        continue
                    if ' ' not in text:
                        continue
                    type_ = LABELS.get(entity.label_)
                    if type_ is None:
                        continue
                    length = entity.end_char - entity.start_char
                    yield ExtractedEntity(label=text,
                                          offset=entity.start_char,
                                          length=length,
                                          type=type_)
            except Exception:
                log.exception("Cannot extract. Language: %s", language)


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
