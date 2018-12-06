import logging
from banal import ensure_list
from followthemoney import model

from aleph.core import settings

log = logging.getLogger(__name__)


def schema_index(schema):
    """Convert a schema object to an index name."""
    return '-'.join((settings.ENTITIES_INDEX, schema.name.lower()))


def entities_write_index(schema):
    """Index that us currently written by new queries."""
    if not settings.ENTITIES_INDEX_SPLIT:
        return settings.ENTITIES_INDEX

    return schema_index(model.get(schema))


def entities_read_index(schema=None, descendants=True, exclude=None):
    """Combined index to run all queries against."""
    if not settings.ENTITIES_INDEX_SPLIT:
        indexes = set(settings.ENTITIES_INDEX_SET)
        indexes.add(settings.ENTITIES_INDEX)
        return ','.join(indexes)

    schemata = set()
    names = ensure_list(schema) or model.schemata.values()
    for schema in names:
        schema = model.get(schema)
        if schema is None:
            continue
        schemata.add(schema)
        if descendants:
            schemata.update(schema.descendants)
    exclude = model.get(exclude)
    indexes = list(settings.ENTITIES_INDEX_SET)
    for schema in schemata:
        if not schema.abstract and schema != exclude:
            indexes.append(schema_index(schema))
    # log.info("Read index: %r", indexes)
    return ','.join(indexes)


def records_write_index():
    """Index that us currently written by new queries."""
    return settings.RECORDS_INDEX


def records_read_index():
    """Combined index to run all queries against."""
    return ','.join(settings.RECORDS_INDEX_SET)


def collections_index():
    """Combined index to run all queries against."""
    return settings.COLLECTIONS_INDEX


def all_indexes():
    return ','.join((collections_index(),
                     entities_read_index(),
                     records_read_index()))
