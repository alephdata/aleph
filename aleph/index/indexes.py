import logging
from banal import ensure_list
from followthemoney import model
from followthemoney.types import registry

from aleph.core import settings
from aleph.index.util import index_settings, configure_index

log = logging.getLogger(__name__)


DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd||yyyy-MM||yyyy"
PARTIAL_DATE = {"type": "date", "format": DATE_FORMAT}
LATIN_TEXT = {"type": "text", "analyzer": "icu_latin"}
RAW_TEXT = {"type": "text", "copy_to": "text"}
KEYWORD = {"type": "keyword"}
LATIN_KEYWORD = {"type": "keyword", "normalizer": "icu_latin"}
TYPE_MAPPINGS = {
    registry.text: LATIN_TEXT,
    registry.date: PARTIAL_DATE,
}


def index_name(name, version):
    return '-'.join((settings.INDEX_PREFIX, name, version))


def collections_index():
    """Combined index to run all queries against."""
    return index_name('collection', settings.INDEX_WRITE)


def all_indexes():
    return ','.join((collections_index(), entities_read_index()))


def configure_collections():
    mapping = {
        "date_detection": False,
        "dynamic_templates": [
            {
                "fields": {
                    "match": "schemata.*",
                    "mapping": {"type": "long"}
                }
            }
        ],
        "_source": {
            "excludes": ["text"]
        },
        "properties": {
            "label": {
                "type": "text",
                "copy_to": "text",
                "analyzer": "icu_latin",
                "fields": {"kw": KEYWORD}
            },
            "collection_id": KEYWORD,
            "foreign_id": KEYWORD,
            "languages": KEYWORD,
            "countries": KEYWORD,
            "category": KEYWORD,
            "summary": RAW_TEXT,
            "publisher": KEYWORD,
            "publisher_url": KEYWORD,
            "data_url": KEYWORD,
            "info_url": KEYWORD,
            "kind": KEYWORD,
            "creator_id": KEYWORD,
            "team_id": KEYWORD,
            "text": {
                "type": "text",
                "analyzer": "icu_latin",
                "term_vector": "with_positions_offsets",
                "store": True
            },
            "casefile": {"type": "boolean"},
            "secret": {"type": "boolean"},
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"},
            "count": {"type": "long"},
            "schemata": {"type": "object"}
        }
    }
    configure_index(collections_index(), mapping, index_settings())


def schema_index(schema, version):
    """Convert a schema object to an index name."""
    name = 'entity-%s' % schema.name.lower()
    return index_name(name, version=version)


def entities_write_index(schema):
    """Index that us currently written by new queries."""
    return schema_index(model.get(schema), settings.INDEX_WRITE)


def entities_read_index(schema=None):
    """Combined index to run all queries against."""
    schemata = set()
    names = ensure_list(schema) or model.schemata.values()
    for schema in names:
        schema = model.get(schema)
        if schema is not None:
            schemata.add(schema)
            schemata.update(schema.descendants)
    indexes = []
    for schema in schemata:
        if not schema.abstract:
            for version in settings.INDEX_READ:
                indexes.append(schema_index(schema, version))
    # log.info("Read index: %r", indexes)
    return ','.join(indexes)


def configure_entities():
    for schema in model.schemata.values():
        if not schema.abstract:
            for version in settings.INDEX_READ:
                configure_schema(schema, version)


def configure_schema(schema, version):
    # Generate relevant type mappings for entity properties so that
    # we can do correct searches on each.
    schema_mapping = {}
    for prop in schema.properties.values():
        config = dict(TYPE_MAPPINGS.get(prop.type, KEYWORD))
        config['copy_to'] = ['text']
        schema_mapping[prop.name] = config

    mapping = {
        "date_detection": False,
        "_source": {
            "excludes": ["text", "fingerprints"]
        },
        "properties": {
            "name": {
                "type": "text",
                "analyzer": "icu_latin",
                "fields": {"kw": KEYWORD},
                "boost": 3.0,
                "copy_to": "text"
            },
            "schema": KEYWORD,
            "schemata": KEYWORD,
            "bulk": {"type": "boolean"},
            "status": KEYWORD,
            "error_message": RAW_TEXT,
            "foreign_id": KEYWORD,
            "document_id": KEYWORD,
            "collection_id": KEYWORD,
            "uploader_id": KEYWORD,
            "fingerprints": LATIN_KEYWORD,
            "entities": KEYWORD,
            "languages": KEYWORD,
            "countries": KEYWORD,
            "keywords": KEYWORD,
            "ips": KEYWORD,
            "emails": KEYWORD,
            "phones": KEYWORD,
            "identifiers": KEYWORD,
            "addresses": {
                "type": "keyword",
                "fields": {"text": LATIN_TEXT}
            },
            "dates": PARTIAL_DATE,
            "names": {
                "type": "keyword",
                "fields": {"text": LATIN_TEXT},
                "copy_to": "text"
            },
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"},
            "text": {
                "type": "text",
                "analyzer": "icu_latin",
                "term_vector": "with_positions_offsets",
                "store": True
            },
            "properties": {
                "type": "object",
                "properties": schema_mapping
            }
        }
    }
    index = schema_index(model.get(schema), version)
    configure_index(index, mapping, index_settings())
