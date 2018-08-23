import spacy
import logging
from polyglot.text import Text
from alephclient.services.entityextract_pb2 import ExtractedEntity  # noqa

from entityextractor.result import PersonResult, LocationResult
from entityextractor.result import OrganizationResult, LanguageResult

log = logging.getLogger(__name__)

POLYGLOT_TYPES = {
    'I-PER': PersonResult,
    'I-ORG': OrganizationResult,
    'I-LOC': LocationResult
}

# https://spacy.io/api/annotation#named-entities
SPACY_TYPES = {
    'PER': PersonResult,
    'PERSON': PersonResult,
    'ORG': OrganizationResult,
    'LOC': LocationResult,
    'GPE': LocationResult
}
SPACY = spacy.load('xx')


def extract_polyglot(ctx, text, languages):
    try:
        parsed = Text(text)
        if parsed.language.confidence > 90:
            yield LanguageResult(ctx, parsed.language.code, 0, len(text))
        for entity in parsed.entities:
            label = ' '.join(entity)
            clazz = POLYGLOT_TYPES.get(entity.tag)
            if clazz is not None:
                yield clazz(ctx, label, entity.start, entity.end)
    except Exception:
        log.exception("polyglot failed")


def extract_spacy(ctx, text, languages):
    try:
        doc = SPACY(text)
        for ent in doc.ents:
            clazz = SPACY_TYPES.get(ent.label_)
            if clazz is not None:
                yield clazz(ctx, ent.text, ent.start, ent.end)
    except Exception:
        log.exception("spaCy failed")
