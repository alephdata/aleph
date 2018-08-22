import os
import spacy
import logging
from polyglot.text import Text
from alephclient.services.entityextract_pb2 import ExtractedEntity  # noqa

from entityextractor.result import PersonResult, LocationResult
from entityextractor.result import OrganizationResult

log = logging.getLogger(__name__)

# POLYGLOT_LANGUAGES = os.listdir('/data/polyglot/polyglot_data/ner2')
POLYGLOT_LANGUAGES = []
POLYGLOT_TYPES = {
    'I-PER': PersonResult,
    'I-ORG': OrganizationResult,
    'I-LOC': LocationResult
}

# https://spacy.io/api/annotation#named-entities
SPACY_TYPES = {
    'PERSON': PersonResult,
    # 'NORP': OrganizationResult,
    'ORG': OrganizationResult,
    'LOC': LocationResult,
    'GPE': LocationResult
}
SPACY_LANGUAGES = ['en', 'de', 'es', 'pt', 'fr', 'it', 'nl']
SPACY_MODELS = {}


def extract_polyglot(ctx, text, language):
    if language not in POLYGLOT_LANGUAGES:
        return
    try:
        parsed = Text(text, hint_language_code=language)
        for entity in parsed.entities:
            label = ' '.join(entity)
            clazz = POLYGLOT_TYPES.get(entity.tag)
            if clazz is not None:
                yield clazz(ctx, label, entity.start, entity.end)
    except Exception:
        log.exception("Cannot extract. Language: %s", language)


def extract_spacy(ctx, text, language):
    if language not in SPACY_LANGUAGES:
        return
    if language not in SPACY_MODELS:
        log.info("Loading spaCy model: %s", language)
        SPACY_MODELS[language] = spacy.load(language)
    nlp = SPACY_MODELS.get(language)
    try:
        doc = nlp(text)
        for ent in doc.ents:
            clazz = SPACY_TYPES.get(ent.label_)
            if clazz is not None:
                yield clazz(ctx, ent.text, ent.start, ent.end)
    except Exception:
        log.exception("Cannot extract. Language: %s", language)
