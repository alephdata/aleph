import time
import grpc
import regex
import logging
from concurrent import futures
from normality import collapse_spaces
from polyglot.text import Text

from aleph.services.entityextract_pb2_grpc import add_EntityExtractServicer_to_server  # noqa
from aleph.services.entityextract_pb2_grpc import EntityExtractServicer  # noqa
from aleph.services.entityextract_pb2 import ExtractedEntity  # noqa

log = logging.getLogger('service')
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

        entity_count = 0
        for language in request.languages:
            try:
                parsed = Text(text, hint_language_code=language)
                for entity in parsed.entities:
                    label = ' '.join(entity)
                    label = CLEAN.sub(' ', label)
                    label = collapse_spaces(label)
                    if len(label) < 4 or len(label) > 200:
                        continue
                    if ' ' not in label:
                        continue
                    length = entity.end - entity.start
                    entity_count += 1
                    yield ExtractedEntity(label=label,
                                          offset=entity.start,
                                          length=length,
                                          type=TYPES[entity.tag])
            except Exception:
                log.exception("Cannot extract. Language: %s", language)
        log.info("Extract: extracted %s entities.", entity_count)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    add_EntityExtractServicer_to_server(PolyglotServicer(), server)
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
