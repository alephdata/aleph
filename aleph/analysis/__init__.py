import logging
from followthemoney.types import registry
from followthemoney.helpers import name_entity

from aleph.core import settings
from aleph.model import Document
from aleph.analysis.aggregate import TagAggregator
from aleph.analysis.extract import extract_entities
from aleph.analysis.patterns import extract_patterns
from aleph.analysis.language import detect_languages
from aleph.analysis.util import load_places, text_chunks

# TODO: this doesn't really have that much to do with aleph and
# could be it's own package, e.g. followthemoney-tagger.
log = logging.getLogger(__name__)


def extract_named_entities(entity):
    if not settings.TAG_ENTITIES:
        return
    # TODO: should we have a schema called "Taggable" with
    # the XXmentioned properties?
    if not entity.schema.is_a(Document.SCHEMA):
        return
    # HACK: Tables will be mapped, don't try to tag them here.
    if entity.schema.is_a(Document.SCHEMA_TABLE):
        return

    load_places()
    aggregator = TagAggregator()
    texts = entity.get_type_values(registry.text)
    for text in text_chunks(texts):
        detect_languages(entity, text)
        for (prop, tag) in extract_entities(entity, text):
            aggregator.add(prop, tag)
        for (prop, tag) in extract_patterns(entity, text):
            aggregator.add(prop, tag)

    for (label, prop) in aggregator.entities:
        entity.add(prop, label, quiet=True, cleaned=True)

    if len(aggregator):
        log.debug("Extracted %d tags [%s]: %s", len(aggregator),
                  entity.id, entity.caption)


def analyze_entity(entity):
    extract_named_entities(entity)
    name_entity(entity)
