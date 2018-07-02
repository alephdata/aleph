import grpc
import logging

from aleph import settings
from aleph.analyze.analyzer import EntityAnalyzer
from aleph.model import DocumentTag
from alephclient.services.entityextract_pb2_grpc import EntityExtractStub
from alephclient.services.entityextract_pb2 import ExtractedEntity
from alephclient.services.common_pb2 import Text

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

    # def get_channel(self):
    #     cls = type(self)
    #     if not hasattr(cls, '_channel') or cls._channel is None:
    #         options = (('grpc.lb_policy_name', 'round_robin'),)
    #         cls._channel = grpc.insecure_channel(cls.SERVICE, options)
    #     return cls._channel

    # def reset(self):
    #     cls = type(self)
    #     cls._channel = None

    def make_iterator(self, document):
        languages = list(document.languages)
        if not len(languages):
            languages = [settings.DEFAULT_LANGUAGE]
        for text in document.texts:
            if len(text) <= self.MIN_LENGTH:
                continue
            text = Text(text=text, languages=languages)
            yield text

    def extract(self, collector, document):
        try:
            channel = grpc.insecure_channel(self.SERVICE)
            service = EntityExtractStub(channel)
            entities = service.Extract(self.make_iterator(document)).entities
            for entity in entities:
                type_ = self.TYPES.get(entity.type)
                if type_ is None:
                    continue
                collector.emit(entity.label, type_, weight=entity.weight)
            log.info('%s Extracted %s entities.', self.SERVICE, len(collector))
        except grpc.RpcError as exc:
            log.warning("gRPC Error: %s", exc)
            # self.reset()


class PolyglotEntityExtractor(EntityExtractor):
    ORIGIN = 'polyglot'
    SERVICE = settings.POLYGLOT_SERVICE


class SpacyEntityExtractor(EntityExtractor):
    ORIGIN = 'spacy'
    SERVICE = settings.SPACY_SERVICE
