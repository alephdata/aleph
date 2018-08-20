import os
import spacy
import logging
from polyglot.text import Text
from alephclient.services.entityextract_pb2 import ExtractedEntity  # noqa

from entityextractor.regex_patterns import (
    EMAIL_REGEX, PHONE_REGEX, IPV4_REGEX, IPV6_REGEX, IBAN_REGEX
)

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
    EMAIL_REGEX: ExtractedEntity.EMAIL,
    PHONE_REGEX: ExtractedEntity.PHONE,
    IPV4_REGEX: ExtractedEntity.IPADDRESS,
    IPV6_REGEX: ExtractedEntity.IPADDRESS,
    IBAN_REGEX: ExtractedEntity.IBAN,
}


def extract_polyglot(text, language):
    if language not in POLYGLOT_LANGUAGES:
        return
    try:
        parsed = Text(text, hint_language_code=language)
        for entity in parsed.entities:
            label = ' '.join(entity)
            # log.info('%s: %s', label, entity.tag)
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
            # log.info('%s: %s', ent.text, ent.label_)
            category = SPACY_TYPES.get(ent.label_)
            if category is not None:
                yield ent.text, category, ent.start, ent.end
    except Exception:
        log.exception("Cannot extract. Language: %s", language)


def extract_regex(text):
    for pattern in REGEX_TYPES:
        for match in pattern.finditer(text):
            match_text = match.group(0)
            if match_text is not None:
                category = REGEX_TYPES.get(pattern)
                start, end = match.span()
                # log.info("%s: %s", match_text, category)
                yield match_text, category, start, end
