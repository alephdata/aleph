import grpc
import logging

from aleph import settings
from aleph.analyze.analyzer import EntityAnalyzer, TextIterator
from aleph.model import DocumentTag
from alephclient.services.entityextract_pb2_grpc import EntityExtractStub
from alephclient.services.entityextract_pb2 import ExtractedEntity

log = logging.getLogger(__name__)
TYPE = ExtractedEntity.Type.Value


class EntityExtractor(EntityAnalyzer, TextIterator):
    TYPES = {
        TYPE('PERSON'): DocumentTag.TYPE_PERSON,
        TYPE('ORGANIZATION'): DocumentTag.TYPE_ORGANIZATION,
        TYPE('COMPANY'): DocumentTag.TYPE_ORGANIZATION,
    }

    def __init__(self):
        self.active = self.SERVICE is not None

    def extract(self, collector, document):
        try:
            channel = grpc.insecure_channel(self.SERVICE)
            service = EntityExtractStub(channel)
            texts = self.text_iterator(document)
            entities = service.Extract(texts)
            for entity in entities.entities:
                type_ = self.TYPES.get(entity.type)
                if type_ is None:
                    continue
                collector.emit(entity.label, type_, weight=entity.weight)
            log.info('%s Extracted %s entities.', self.SERVICE, len(collector))
        except grpc.RpcError as exc:
            log.warning("gRPC Error: %s", exc)


class PolyglotEntityExtractor(EntityExtractor):
    ORIGIN = 'polyglot'
    SERVICE = settings.POLYGLOT_SERVICE


class SpacyEntityExtractor(EntityExtractor):
    ORIGIN = 'spacy'
    SERVICE = settings.SPACY_SERVICE
