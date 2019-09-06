import logging

import spacy
import fasttext
from banal import ensure_list
from normality import collapse_spaces
from fingerprints import clean_entity_name
from followthemoney.types import registry

from aleph.core import settings, kv
from aleph.analysis.util import tag_key, place_key

log = logging.getLogger(__name__)
TEXT_MIN_LENGTH = 60
TEXT_MAX_LENGTH = 900000
NAME_MAX_LENGTH = 100
NAME_MIN_LENGTH = 4
# https://spacy.io/api/annotation#named-entities
SPACY_TYPES = {
    'PER': registry.name,
    'PERSON': registry.name,
    'ORG': registry.name,
    'LOC': registry.address,
    'GPE': registry.address
}


def clean_name(text):
    if text is None or len(text) > NAME_MAX_LENGTH:
        return
    text = clean_entity_name(text)
    text = collapse_spaces(text)
    if text is None or len(text) <= NAME_MIN_LENGTH or ' ' not in text:
        return
    return text


def location_country(location):
    try:
        key = tag_key(location)
        value = kv.lrange(place_key(key), 0, -1)
        return ensure_list(value)
    except KeyError:
        return []


def get_language(text):
    """Given a list of lines, return a list of (line, lang)"""
    if not hasattr(settings, '_lang_detector'):
        lid_model = fasttext.load_model(settings.LID_MODEL_PATH)
        settings._lang_detector = lid_model
    langs = settings._lang_detector.predict(text.replace('\n', ' '))
    # fasttext labels are prefixed, with '__label__' by default
    langs = [lang.replace('__label__', '') for lang in langs[0]]
    return langs[0]


def extract_entities(entity, text):
    if len(text) < TEXT_MIN_LENGTH or len(text) > TEXT_MAX_LENGTH:
        return
    langs = get_language(text)
    entity.add('detectedLanguage', langs)
    if langs == ['en']:
        lang = 'en'
    else:
        lang = 'xx'
    attr_name = '_nlp_' + lang
    if not hasattr(settings, attr_name):
        log.info("Loading spaCy model: %s..." % lang)
        setattr(settings, attr_name, spacy.load(lang))
    doc = getattr(settings, attr_name)(text)
    for ent in doc.ents:
        tag_type = SPACY_TYPES.get(ent.label_)
        if tag_type is None:
            continue
        if tag_type == registry.name:
            name = clean_name(ent.text)
            yield (registry.name, name)
        if tag_type == registry.address:
            for country in location_country(ent.text):
                yield (registry.country, country)
