import spacy
import logging

from aleph import settings
from aleph.logic.extractors.result import PersonResult
from aleph.logic.extractors.result import LocationResult
from aleph.logic.extractors.result import OrganizationResult

log = logging.getLogger(__name__)
MIN_LENGTH = 60
MAX_LENGTH = 100000
# https://spacy.io/api/annotation#named-entities
SPACY_TYPES = {
    'PER': PersonResult,
    'PERSON': PersonResult,
    'ORG': OrganizationResult,
    'LOC': LocationResult,
    'GPE': LocationResult
}


def extract_entities(ctx, text, languages):
    if text is None or len(text) < MIN_LENGTH:
        return
    if not hasattr(settings, '_nlp'):
        settings._nlp = spacy.load('xx')
    doc = settings._nlp(text)
    for ent in doc.ents:
        clazz = SPACY_TYPES.get(ent.label_)
        label = ent.text.strip()
        if clazz is not None and len(label):
            yield clazz.create(ctx, label, ent.start, ent.end)
