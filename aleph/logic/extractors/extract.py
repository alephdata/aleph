import logging
import textwrap

from alephclient.services.common_pb2 import Text
from alephclient.services.entityextract_pb2 import ExtractedEntity
from alephclient.services.entityextract_pb2_grpc import EntityExtractStub

from aleph import settings
from aleph.services import ServiceClientMixin
from aleph.logic.extractors.result import PersonResult, LocationResult
from aleph.logic.extractors.result import OrganizationResult, LanguageResult
from aleph.util import backoff, trace_function

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

    @trace_function(span_name='NER')
    def extract(self, text, languages):
        if text is None or len(text) < self.MIN_LENGTH:
            return
        texts = textwrap.wrap(text, self.MAX_LENGTH)
        for text in texts:
            for attempt in range(10):
                try:
                    service = EntityExtractStub(self.channel)
                    req = Text(text=text, languages=languages)
                    for res in service.Extract(req):
                        clazz = self.TYPES.get(res.type)
                        yield (res.text, clazz, res.start, res.end)
                    break
                except self.Error as e:
                    if e.code() == self.Status.RESOURCE_EXHAUSTED:
                        continue
                    log.warning("gRPC [%s]: %s", e.code(), e.details())
                    backoff(failures=attempt)
                    self.reset_channel()


def extract_entities(ctx, text, languages):
    if not hasattr(settings, '_ner_service'):
        settings._ner_service = NERService()
    entities = settings._ner_service.extract(text, languages=languages)
    for (text, clazz, start, end) in entities:
        yield clazz.create(ctx, text, start, end)
