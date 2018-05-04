import time
import grpc
import regex
import logging
from concurrent import futures
from normality import collapse_spaces
from polyglot.text import Text

from alephprotos import add_EntityExtractServicer_to_server  # noqa
from alephprotos import EntityExtractServicer, Entity

log = logging.getLogger('polyglotservice')
CLEAN = regex.compile('(^[^\w]*|[^\w]*$)')
TYPES = {
    'I-PER': 'PERSON',
    'I-ORG': 'ORGANIZATION',
    'I-LOC': 'LOCATION'
}


class PolyglotServicer(EntityExtractServicer):

    def ExtractText(self, text, languages):
        for language in languages:
            try:
                parsed = Text(text, hint_language_code=language)
                for entity in parsed.entities:
                    label = ' '.join(entity)
                    label = CLEAN.sub(' ', label)
                    label = collapse_spaces(label)
                    if ' ' not in label or len(label) < 4 or len(label) > 200:
                        continue
                    yield label, TYPES[entity.tag], 0, 0
            except ValueError:
                log.info("Cannot extract. Language: %s", language)

    def Extract(self, request_iterator, context):
        for text in request_iterator:
            entities = self.ExtractText(text.text, text.languages)
            for (label, type_, offset, length) in entities:
                yield Entity(label=label,
                             offset=offset,
                             length=length,
                             type=type_)


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
        server.stop(0)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    logging.getLogger('polyglot').setLevel(logging.INFO)
    serve()
