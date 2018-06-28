import os
import time
import regex
import logging
from collections import Counter
from concurrent import futures

import grpc
from normality import collapse_spaces
from polyglot.text import Text

from alephclient.services.entityextract_pb2_grpc import add_EntityExtractServicer_to_server  # noqa
from alephclient.services.entityextract_pb2_grpc import EntityExtractServicer  # noqa
from alephclient.services.entityextract_pb2 import ExtractedEntity, ExtractedEntitySet  # noqa

log = logging.getLogger('service')
LANGUAGES = os.listdir('/data/polyglot_data/ner2')
CLEAN = regex.compile('(^[^\w]*|[^\w]*$)')
TYPES = {
    'I-PER': ExtractedEntity.PERSON,
    'I-ORG': ExtractedEntity.ORGANIZATION,
    'I-LOC': ExtractedEntity.LOCATION
}


class PolyglotServicer(EntityExtractServicer):

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
                        labels[label] += 1
                        types[label] = entity.tag
                except Exception:
                    log.exception("Cannot extract. Language: %s", language)
        for label in labels:
            weight = labels[label]
            entity = entities.entities.add()
            entity.label = label
            entity.weight = weight
            entity.type = TYPES[types[label]]
        return entities


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
