import os
import spacy
import logging
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
