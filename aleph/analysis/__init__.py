import logging
from followthemoney.types import registry

from aleph.core import settings
from aleph.model import Document, Entity
from aleph.analysis.aggregate import TagAggregator
from aleph.analysis.extract import extract_entities
from aleph.analysis.patterns import extract_patterns
from aleph.analysis.util import load_places

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
    for text in entity.get_type_values(registry.text):
        for (prop, tag) in extract_entities(entity, text):
            aggregator.add(prop, tag)
        for (prop, tag) in extract_patterns(entity, text):
            aggregator.add(prop, tag)

    for (label, prop) in aggregator.entities:
        entity.add(prop, label, quiet=True, cleaned=True)

    if len(aggregator):
        log.info("Extracted %d tags [%s]: %s", len(aggregator),
                 entity.id, entity.caption)


def name_entity(entity):
    """If an entity has multiple names, pick the most central one
    and set all the others as aliases. This is awkward given that
    names aren't special and may not always be the caption."""
    if not entity.schema.is_a(Entity.THING):
        return
    names = entity.get('name')
    if len(names) <= 1:
        return
    name = registry.name.pick(names)
    names.remove(name)
    entity.set('name', name)
    entity.add('alias', names)


def analyze_entity(entity):
    extract_named_entities(entity)
    name_entity(entity)
