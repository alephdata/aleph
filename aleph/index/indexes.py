import logging
from banal import ensure_list
from followthemoney import model
from followthemoney.types import registry
from followthemoney.exc import InvalidData

from aleph.core import settings
from aleph.index.util import index_settings, configure_index, get_shard_weight

log = logging.getLogger(__name__)


DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd||yyyy-MM||yyyy"
PARTIAL_DATE = {"type": "date", "format": DATE_FORMAT}
LATIN_TEXT = {"type": "text", "analyzer": "icu_latin"}
KEYWORD = {"type": "keyword"}
KEYWORD_COPY = {"type": "keyword", "copy_to": "text"}
TYPE_MAPPINGS = {
    registry.text: {"type": "text", "index": False},
    registry.json: {"type": "text", "index": False},
    registry.date: PARTIAL_DATE,
}


def index_name(name, version):
    return '-'.join((settings.INDEX_PREFIX, name, version))


def collections_index():
    """Combined index to run all queries against."""
    return index_name('collection', settings.INDEX_WRITE)


def configure_collections():
    mapping = {
        "date_detection": False,
        "dynamic": False,
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
            "foreign_id": KEYWORD_COPY,
            "languages": KEYWORD_COPY,
            "countries": KEYWORD_COPY,
            "category": KEYWORD_COPY,
            "summary": {
                "type": "text",
                "copy_to": "text",
                "index": False
            },
            "publisher": KEYWORD_COPY,
            "publisher_url": KEYWORD_COPY,
            "data_url": KEYWORD_COPY,
            "info_url": KEYWORD_COPY,
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
            "schemata": {
                "dynamic": True,
                "type": "object"
            }
        }
    }
    index = collections_index()
    settings = index_settings(shards=1)
    return configure_index(index, mapping, settings)


def schema_index(schema, version):
    """Convert a schema object to an index name."""
    if schema.abstract:
        raise InvalidData("Cannot index abstract schema: %s" % schema)
    name = 'entity-%s' % schema.name.lower()
    return index_name(name, version=version)


def schema_scope(schema, expand=True):
    schemata = set()
    names = ensure_list(schema) or model.schemata.values()
    for schema in names:
        schema = model.get(schema)
        if schema is not None:
            schemata.add(schema)
            if expand:
                schemata.update(schema.descendants)
    for schema in schemata:
        if not schema.abstract:
            yield schema


def entities_index_list(schema=None, expand=True):
    """Combined index to run all queries against."""
    for schema in schema_scope(schema, expand=expand):
        for version in settings.INDEX_READ:
            yield schema_index(schema, version)


def entities_read_index(schema=None, expand=True):
    indexes = entities_index_list(schema=schema, expand=expand)
    return ','.join(indexes)


def entities_write_index(schema):
    """Index that us currently written by new queries."""
    schema = model.get(schema)
    return schema_index(schema, settings.INDEX_WRITE)


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
        "dynamic": False,
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
            "foreign_id": KEYWORD,
            "document_id": KEYWORD,
            "collection_id": KEYWORD,
            "uploader_id": KEYWORD,
            "entities": KEYWORD,
            "languages": KEYWORD,
            "countries": KEYWORD,
            "checksums": KEYWORD,
            "keywords": KEYWORD,
            "ips": KEYWORD,
            "urls": KEYWORD,
            "ibans": KEYWORD,
            "emails": KEYWORD,
            "phones": KEYWORD,
            "mimetypes": KEYWORD,
            "identifiers": KEYWORD,
            "dates": PARTIAL_DATE,
            "addresses": {
                "type": "keyword",
                "fields": {"text": LATIN_TEXT}
            },
            "names": {
                "type": "keyword",
                "fields": {"text": LATIN_TEXT},
                "copy_to": "text"
            },
            "fingerprints": {
                "type": "keyword",
                "normalizer": "icu_latin",
                "copy_to": "text",
                "fields": {"text": LATIN_TEXT}
            },
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
    settings = index_settings(shards=get_shard_weight(schema))
    return configure_index(index, mapping, settings)
