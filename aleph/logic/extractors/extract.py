import logging
from alephclient.services.entityextract_pb2 import Text, ExtractedEntity
from alephclient.services.entityextract_pb2_grpc import ExtractEntityStub

from aleph import settings
from aleph.services import ServiceClientMixin
from aleph.logic.extractors.result import PersonResult, LocationResult
from aleph.logic.extractors.result import OrganizationResult, LanguageResult
from aleph.util import backoff

log = logging.getLogger(__name__)


class NERService(ServiceClientMixin):
    SERVICE = settings.NER_SERVICE
    MIN_LENGTH = 60
    MAX_LENGTH = 100000
    TYPES = {
        ExtractedEntity.ORGANIZATION: OrganizationResult,
        ExtractedEntity.PERSON: PersonResult,
        ExtractedEntity.LOCATION: LocationResult,
        ExtractedEntity.LANGUAGE: LanguageResult
    }

    def extract(self, text):
        if text is None or len(text) < self.MIN_LENGTH:
            return
        text = text[:self.MAX_LENGTH]
        for attempt in range(10):
            try:
                service = ExtractEntityStub(self.channel)
                text = Text(data=text)
                for res in service.Extract(text):
                    clazz = self.TYPES.get(res.type)
                    yield (res.text, clazz, res.start, res.end)
            except self.Error as e:
                if e.code() == self.Status.RESOURCE_EXHAUSTED:
                    continue
                log.warning("gRPC [%s]: %s", e.code(), e.details())
                backoff(failures=attempt)
                self.reset_channel()


def extract_entities(ctx, text):
    if not hasattr(settings, '_ner_service'):
        settings._ner_service = NERService()
    for (text, clazz, start, end) in settings._ner_service.extract(text):
        yield clazz.create(ctx, text, start, end)
