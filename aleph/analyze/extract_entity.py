import grpc
import time
import logging

from aleph import settings
from aleph.analyze.analyzer import EntityAnalyzer
from aleph.model import DocumentTag
from alephclient.services.entityextract_pb2_grpc import EntityExtractStub
from alephclient.services.entityextract_pb2 import ExtractedEntity, Text

log = logging.getLogger(__name__)
TYPE = ExtractedEntity.Type.Value


class EntityExtractor(EntityAnalyzer):
    MIN_LENGTH = 100
    TYPES = {
        TYPE('PERSON'): DocumentTag.TYPE_PERSON,
        TYPE('ORGANIZATION'): DocumentTag.TYPE_ORGANIZATION,
        TYPE('COMPANY'): DocumentTag.TYPE_ORGANIZATION,
    }

    def __init__(self):
        self.active = self.SERVICE is not None

    def get_service(self):
        cls = type(self)
        if not hasattr(cls, '_channel') or cls._channel is None:
            channel = grpc.insecure_channel(self.SERVICE)
        return EntityExtractStub(channel)

    def reset(self):
        cls = type(self)
        cls._channel = None

    def extract(self, collector, document):
        languages = list(document.languages)
        if not len(languages):
            languages = [settings.DEFAULT_LANGUAGE]

        for text in document.texts:
            if len(text) <= self.MIN_LENGTH:
                continue
            text = Text(text=text, languages=languages)
            try:
                service = self.get_service()
                for entity in service.Extract(text):
                    type_ = self.TYPES.get(entity.type)
                    if type_ is None:
                        continue
                    collector.emit(entity.label, type_)
            except Exception:
                log.exception('RPC call failed')
                self.reset()
                time.sleep(1)

        if len(collector):
            log.info('%s Extracted %s entities.', self.SERVICE, len(collector))


class PolyglotEntityExtractor(EntityExtractor):
    ORIGIN = 'polyglot'
    SERVICE = settings.POLYGLOT_SERVICE


class SpacyEntityExtractor(EntityExtractor):
    ORIGIN = 'spacy'
    SERVICE = settings.SPACY_SERVICE
