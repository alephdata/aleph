import os
import spacy
import logging
import re
from polyglot.text import Text
from alephclient.services.entityextract_pb2 import ExtractedEntity  # noqa

log = logging.getLogger(__name__)

POLYGLOT_LANGUAGES = os.listdir('/data/polyglot_data/ner2')
POLYGLOT_TYPES = {
    'I-PER': ExtractedEntity.PERSON,
    'I-ORG': ExtractedEntity.ORGANIZATION,
    'I-LOC': ExtractedEntity.LOCATION
}

# https://spacy.io/api/annotation#named-entities
SPACY_TYPES = {
    'PERSON': ExtractedEntity.PERSON,
    # 'NORP': ExtractedEntity.ORGANIZATION,
    'ORG': ExtractedEntity.ORGANIZATION,
    'LOC': ExtractedEntity.LOCATION,
    'GPE': ExtractedEntity.LOCATION
}
SPACY_LANGUAGES = ['en', 'de', 'es', 'pt', 'fr', 'it', 'nl']
SPACY_MODELS = {}


REGEX_TYPES = {
    r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}': ExtractedEntity.EMAIL,
    r'(\+?[\d\-\(\)\/\s]{5,})': ExtractedEntity.PHONE,
    r'\b(0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.0*([1-9]?\d|1\d\d|2[0-4]\d|25[0-5]))\b'  # noqa
        : ExtractedEntity.IPADDRESS,
    r'\b([a-zA-Z]{2} ?[0-9]{2} ?[a-zA-Z0-9]{4} ?[0-9]{7} ?([a-zA-Z0-9]?){0,16})\b'  # noqa
        : ExtractedEntity.IBAN,
}


def extract_polyglot(text, language):
    if language not in POLYGLOT_LANGUAGES:
        return
    try:
        parsed = Text(text, hint_language_code=language)
        for entity in parsed.entities:
            label = ' '.join(entity)
            category = POLYGLOT_TYPES.get(entity.tag)
            if category is not None:
                # TODO: do we need start, end offsets?
                yield label, category, entity.start, entity.end
    except Exception:
        log.exception("Cannot extract. Language: %s", language)


def extract_spacy(text, language):
    if language not in SPACY_LANGUAGES:
        return
    if language not in SPACY_MODELS:
        log.info("Loading spaCy model: %s", language)
        SPACY_MODELS[language] = spacy.load(language)
    nlp = SPACY_MODELS.get(language)
    try:
        doc = nlp(text)
        for ent in doc.ents:
            category = SPACY_TYPES.get(ent.label_)
            if category is not None:
                yield ent.text, category, ent.start, ent.end
    except Exception:
        log.exception("Cannot extract. Language: %s", language)


def extract_regex(text):
    for pattern in REGEX_TYPES:
        RE = re.compile(pattern, re.IGNORECASE)
        for match in RE.finditer(text):
            match_text = match.group(0)
            if match_text is not None:
                category = REGEX_TYPES.get(pattern)
                start, end = match.span()
                yield match_text, category, start, end
