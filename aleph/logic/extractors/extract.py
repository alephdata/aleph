import os
import spacy
import logging
from polyglot.text import Text

from aleph import settings
from aleph.logic.extractors.result import PersonResult, LocationResult
from aleph.logic.extractors.result import OrganizationResult, LanguageResult

log = logging.getLogger(__name__)

MIN_LENGTH = 60
MAX_LENGTH = 100000

POLYGLOT_PATH = os.environ.get('POLYGLOT_DATA_PATH')
POLYGLOT_NER_PATH = os.path.join(POLYGLOT_PATH, 'polyglot_data/ner2')
POLYGLOT_LANGUAGES = os.listdir(POLYGLOT_NER_PATH)
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


def extract_polyglot(ctx, text, languages):
    if len(text) < MIN_LENGTH:
        return
    try:
        parsed = Text(text)
        lang = parsed.language
        if lang.confidence > 90:
            yield LanguageResult(ctx, lang.code, None, None)
        if lang.code not in POLYGLOT_LANGUAGES:
            return
        for entity in parsed.entities:
            label = ' '.join(entity)
            clazz = POLYGLOT_TYPES.get(entity.tag)
            if clazz is not None:
                yield clazz(ctx, label, entity.start, entity.end)
    except Exception as ex:
        log.warning("Polyglot failed: %s" % ex)


def extract_spacy(ctx, text, languages):
    if len(text) < MIN_LENGTH:
        return
    try:
        text = text[:MAX_LENGTH]
        if not hasattr(settings, '_spacy_model'):
            log.debug("Loading spaCy NER model...")
            settings._spacy_model = spacy.load('xx')
        doc = settings._spacy_model(text)
        for ent in doc.ents:
            clazz = SPACY_TYPES.get(ent.label_)
            if clazz is not None:
                yield clazz(ctx, ent.text, ent.start, ent.end)
    except Exception:
        log.exception("spaCy failed")
