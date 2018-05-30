import os
import time
import grpc
import regex
import logging
from concurrent import futures
from normality import collapse_spaces
from polyglot.text import Text

from alephclient.services.entityextract_pb2_grpc import add_EntityExtractServicer_to_server  # noqa
from alephclient.services.entityextract_pb2_grpc import EntityExtractServicer  # noqa
from alephclient.services.entityextract_pb2 import ExtractedEntity  # noqa

log = logging.getLogger('service')
LANGUAGES = os.listdir('/data/polyglot_data/ner2')
CLEAN = regex.compile('(^[^\w]*|[^\w]*$)')
TYPES = {
    'I-PER': 'PERSON',
    'I-ORG': 'ORGANIZATION',
    'I-LOC': 'LOCATION'
}


class PolyglotServicer(EntityExtractServicer):

    def Extract(self, request, context):
        text = request.text
        if text is None or not len(text.strip()):
            return

        for language in request.languages:
            if language not in LANGUAGES:
                continue
            try:
                parsed = Text(text, hint_language_code=language)
                for entity in parsed.entities:
                    label = ' '.join(entity)
                    label = CLEAN.sub(' ', label)
                    label = collapse_spaces(label)
                    if len(label) < 4 or len(label) > 100:
                        continue
                    if ' ' not in label:
                        continue
                    length = entity.end - entity.start
                    yield ExtractedEntity(label=label,
                                          offset=entity.start,
                                          length=length,
                                          type=TYPES[entity.tag])
            except Exception:
                log.exception("Cannot extract. Language: %s", language)


def serve(port):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=20))
    add_EntityExtractServicer_to_server(PolyglotServicer(), server)
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
    logging.getLogger('polyglot').setLevel(logging.INFO)
    serve('[::]:50000')
