import grpc
import logging

from aleph import settings
from aleph.analyze.analyzer import EntityAnalyzer, TextIterator
from aleph.model import DocumentTag, DocumentTagCollector
from alephclient.services.entityextract_pb2_grpc import EntityExtractStub
from alephclient.services.entityextract_pb2 import ExtractedEntity

log = logging.getLogger(__name__)
TYPE = ExtractedEntity.Type.Value


class EntityExtractor(EntityAnalyzer, TextIterator):
    ORIGIN = 'ner'
    TYPES = {
        ExtractedEntity.PERSON: DocumentTag.TYPE_PERSON,
        ExtractedEntity.ORGANIZATION: DocumentTag.TYPE_ORGANIZATION,
        ExtractedEntity.COMPANY: DocumentTag.TYPE_ORGANIZATION,
    }

    def __init__(self):
        service = settings.ENTITIES_SERVICE
        self.active = service is not None
        if self.active:
            self.channel = grpc.insecure_channel(service)

    def extract(self, collector, document):
        DocumentTagCollector(document, 'polyglot').save()
        DocumentTagCollector(document, 'spacy').save()
        try:
            service = EntityExtractStub(self.channel)
            texts = self.text_iterator(document)
            entities = service.Extract(texts)
            for entity in entities.entities:
                type_ = self.TYPES.get(entity.type)
                if type_ is None:
                    continue
                collector.emit(entity.label, type_, weight=entity.weight)
            log.info('Extracted %s entities.', len(collector))
        except grpc.RpcError as exc:
            log.warning("gRPC Error: %s", exc)
