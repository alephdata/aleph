import logging
from followthemoney.types import registry

from aleph.core import settings
from aleph.model import Document
from aleph.analysis.aggregate import TagAggregator
from aleph.analysis.extract import extract_entities
from aleph.analysis.patterns import extract_patterns
from aleph.analysis.util import load_places

# TODO: this doesn't really have that much to do with aleph and
# could be it's own package, e.g. followthemoney-tagger.
log = logging.getLogger(__name__)

MAPPING = {
    registry.name: 'namesMentioned',
    registry.language: 'detectedLanguage',
    registry.country: 'country',
    registry.ip: 'ipMentioned',
    registry.email: 'emailMentioned',
    registry.phone: 'phoneMentioned',
    registry.iban: 'ibanMentioned'
}


def tag_entity(entity):
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
    countries = entity.get_type_values(registry.country)
    for text in entity.get_type_values(registry.text):
        for (type_, tag) in extract_entities(entity, text):
            aggregator.add(type_, tag)
        for (type_, tag) in extract_patterns(text, countries):
            aggregator.add(type_, tag)

    for (label, type_) in aggregator.entities:
        prop = MAPPING.get(type_)
        entity.add(prop, label, quiet=True, cleaned=True)

    if len(aggregator):
        log.info("Extracted %d tags [%s]: %s", len(aggregator),
                 entity.id, entity.caption)
