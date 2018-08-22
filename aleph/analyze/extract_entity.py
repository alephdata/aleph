import logging
from alephclient.services.entityextract_pb2_grpc import EntityExtractStub
from alephclient.services.entityextract_pb2 import ExtractedEntity

from aleph import settings
from aleph.services import ServiceClientMixin
from aleph.analyze.analyzer import EntityAnalyzer, TextIterator
from aleph.model import DocumentTag, DocumentTagCollector

log = logging.getLogger(__name__)
TYPE = ExtractedEntity.Type.Value


class EntityExtractor(EntityAnalyzer, TextIterator, ServiceClientMixin):
    SERVICE = settings.ENTITIES_SERVICE
    ORIGIN = 'ner'
    TYPES = {
        ExtractedEntity.PERSON: DocumentTag.TYPE_PERSON,
        ExtractedEntity.ORGANIZATION: DocumentTag.TYPE_ORGANIZATION,
        ExtractedEntity.COMPANY: DocumentTag.TYPE_ORGANIZATION,
        ExtractedEntity.PHONE: DocumentTag.TYPE_PHONE,
        ExtractedEntity.EMAIL: DocumentTag.TYPE_EMAIL,
        ExtractedEntity.IBAN: DocumentTag.TYPE_IBAN,
        ExtractedEntity.IPADDRESS: DocumentTag.TYPE_IP,
        ExtractedEntity.LOCATION: DocumentTag.TYPE_LOCATION,
        # ExtractedEntity.COUNTRY: DocumentTag.TYPE_LOCATION,
    }

    def __init__(self):
        self.active = self.has_channel()

    def extract(self, collector, document):
        DocumentTagCollector(document, 'polyglot').save()
        DocumentTagCollector(document, 'spacy').save()
        try:
            service = EntityExtractStub(self.channel)
            texts = self.text_iterator(document)
            entities = service.Extract(texts)
            for entity in entities.entities:
                if entity.type == ExtractedEntity.COUNTRY:
                    document.add_country(entity.label)
                type_ = self.TYPES.get(entity.type)
                # log.info('%s: %s', entity.label, type_)
                if type_ is None:
                    continue
                collector.emit(entity.label, type_, weight=entity.weight)
            log.info('Extracted %s entities.', len(collector))
        except self.Error as e:
            log.warning("gRPC [%s]: %s", e.code(), e.details())
