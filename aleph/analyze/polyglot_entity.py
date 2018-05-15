import grpc
import logging

from aleph import settings
from aleph.analyze.analyzer import EntityAnalyzer
from aleph.model import DocumentTag
from alephclient.services.entityextract_pb2_grpc import EntityExtractStub
from alephclient.services.entityextract_pb2 import ExtractedEntity, Text

log = logging.getLogger(__name__)
TYPE = ExtractedEntity.Type.Value


class PolyglotEntityAnalyzer(EntityAnalyzer):
    ORIGIN = 'polyglot'
    MIN_LENGTH = 100
    TYPES = {
        TYPE('PERSON'): DocumentTag.TYPE_PERSON,
        TYPE('ORGANIZATION'): DocumentTag.TYPE_ORGANIZATION,
        TYPE('COMPANY'): DocumentTag.TYPE_ORGANIZATION,
    }

    def __init__(self):
        self.active = settings.POLYGLOT_SERVICE is not None

    def extract(self, collector, document):
        channel = grpc.insecure_channel(settings.POLYGLOT_SERVICE)
        service = EntityExtractStub(channel)
        languages = list(document.languages)
        if not len(languages):
            languages = [settings.DEFAULT_LANGUAGE]
        try:
            for text in document.texts:
                if len(text) <= self.MIN_LENGTH:
                    continue
                text = Text(text=text, languages=languages)
                for entity in service.Extract(text):
                    type_ = self.TYPES.get(entity.type)
                    if type_ is None:
                        continue
                    collector.emit(entity.label, type_)
        except Exception:
            log.exception('RPC call failed')

        if len(collector):
            log.info('Polyglot extracted %s entities.', len(collector))
