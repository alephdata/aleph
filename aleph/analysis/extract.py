import spacy
import logging
from banal import ensure_list
from normality import collapse_spaces
from fingerprints import clean_entity_name
from followthemoney.types import registry

from aleph.core import settings, kv
from aleph.analysis.util import check_text_length
from aleph.analysis.util import tag_key, place_key
from aleph.analysis.util import TAG_PERSON, TAG_COMPANY
from aleph.analysis.util import TAG_LOCATION, TAG_COUNTRY

log = logging.getLogger(__name__)
NAME_MAX_LENGTH = 100
NAME_MIN_LENGTH = 4
# https://spacy.io/api/annotation#named-entities
SPACY_TYPES = {
    'PER': TAG_PERSON,
    'PERSON': TAG_PERSON,
    'ORG': TAG_COMPANY,
    'LOC': TAG_LOCATION,
    'GPE': TAG_LOCATION
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


def _load_model(lang):
    """Load the spaCy model for the specified language"""
    attr_name = '_nlp_%s' % lang
    if not hasattr(settings, attr_name):
        log.info("Loading spaCy model: %s..." % lang)
        try:
            setattr(settings, attr_name, spacy.load(lang))
        except OSError:
            log.error("Cannot load spaCy model: %s", lang)
    return getattr(settings, attr_name)


def get_models(entity):
    """Iterate over the NER models applicable to the given entity."""
    languages = entity.get_type_values(registry.language)
    models = []
    for lang in languages:
        if lang in settings.NER_MODELS:
            models.append(_load_model(lang))
    if not len(models):
        models.append(_load_model(settings.NER_DEFAULT_MODEL))
    return models


def extract_entities(entity, text):
    if not check_text_length(text):
        return
    for model in get_models(entity):
        doc = model(text)
        for ent in doc.ents:
            prop_name = SPACY_TYPES.get(ent.label_)
            if prop_name is None:
                continue
            if prop_name in (TAG_COMPANY, TAG_PERSON):
                name = clean_name(ent.text)
                yield (prop_name, name)
            if prop_name == TAG_LOCATION:
                for country in location_country(ent.text):
                    yield (TAG_COUNTRY, country)
