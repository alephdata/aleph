import logging
import textwrap
from servicelayer.rpc import ExtractedEntity
from servicelayer.rpc import EntityExtractService

from aleph import settings
from aleph.logic.extractors.result import PersonResult, LocationResult
from aleph.logic.extractors.result import OrganizationResult, LanguageResult
from aleph.util import trace_function

log = logging.getLogger(__name__)


class NERService(EntityExtractService):
    MIN_LENGTH = 60
    MAX_LENGTH = 100000
    TYPES = {
        ExtractedEntity.ORGANIZATION: OrganizationResult,
        ExtractedEntity.PERSON: PersonResult,
        ExtractedEntity.LOCATION: LocationResult,
        ExtractedEntity.LANGUAGE: LanguageResult
    }

    @trace_function(span_name='NER')
    def extract_all(self, text, languages):
        if text is None or len(text) < self.MIN_LENGTH:
            return
        if len(text) > self.MAX_LENGTH:
            texts = textwrap.wrap(text, self.MAX_LENGTH)
        else:
            texts = [text]
        for text in texts:
            for res in self.Extract(text, languages):
                clazz = self.TYPES.get(res.type)
                yield (res.text, clazz, res.start, res.end)


def extract_entities(ctx, text, languages):
    if not hasattr(settings, '_ner_service'):
        settings._ner_service = NERService()
    entities = settings._ner_service.extract_all(text, languages=languages)
    for (text, clazz, start, end) in entities:
        yield clazz.create(ctx, text, start, end)
