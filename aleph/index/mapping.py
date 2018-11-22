import logging
from followthemoney import model
from followthemoney.types import registry

from aleph.core import es
from aleph.index.core import collections_index
from aleph.index.core import records_write_index
from aleph.index.core import entities_write_index

log = logging.getLogger(__name__)

DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd||yyyy-MM||yyyy"
PARTIAL_DATE = {"type": "date", "format": DATE_FORMAT}
LATIN_TEXT = {"type": "text", "analyzer": "icu_latin"}
RAW_TEXT = {"type": "text"}
KEYWORD = {"type": "keyword"}
TYPE_MAPPINGS = {
    registry.text: LATIN_TEXT,
    registry.date: PARTIAL_DATE,
}


def configure_index(index, mapping, settings):
    log.info("Configuring index: %s...", index)
    mapping['date_detection'] = False
    res = es.indices.put_mapping(index=index, doc_type='doc',
                                 body=mapping, ignore=[404])
    if res.get('status') == 404:
        body = {
            'settings': settings,
            'mappings': {'doc': mapping}
        }
        res = es.indices.create(index, body=body)


def configure_collections():
    mapping = {
        "dynamic_templates": [
            {
                "fields": {
                    "match": "schemata.*",
                    "mapping": {"type": "long"}
                }
            }
        ],
        "properties": {
            "label": {
                "type": "text",
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
            "text": LATIN_TEXT,
            "casefile": {"type": "boolean"},
            "secret": {"type": "boolean"},
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"},
            "count": {"type": "long"},
            "schemata": {
                "type": "object"
            },
            "creator": {
                "type": "object",
                "properties": {
                    "id": KEYWORD,
                    "type": KEYWORD,
                    "name": {
                        "type": "text",
                        "fields": {"kw": KEYWORD}
                    }
                }
            },
            "team": {
                "type": "object",
                "properties": {
                    "id": KEYWORD,
                    "type": KEYWORD,
                    "name": KEYWORD
                }
            },
        }
    }
    configure_index(collections_index(), mapping, index_settings())


def configure_records():
    mapping = {
        "properties": {
            "collection_id": KEYWORD,
            "document_id": KEYWORD,
            "index": {"type": "long"},
            "text": LATIN_TEXT
        }
    }
    settings = index_settings(shards=10, refresh_interval='15s')
    configure_index(records_write_index(), mapping, settings)


def configure_entities():
    for schema in model.schemata.values():
        if not schema.abstract:
            configure_schema(schema)


def configure_schema(schema):
    # Generate relevant type mappings for entity properties so that
    # we can do correct searches on each.
    schema_mapping = {}
    for name, prop in schema.properties.items():
        config = TYPE_MAPPINGS.get(prop.type, KEYWORD)
        schema_mapping[name] = config

    mapping = {
        "date_detection": False,
        "properties": {
            "title": RAW_TEXT,
            "name": {
                "type": "text",
                "analyzer": "icu_latin",
                "fields": {"kw": KEYWORD}
            },
            "schema": KEYWORD,
            "schemata": KEYWORD,
            "bulk": {"type": "boolean"},
            "status": KEYWORD,
            "error_message": RAW_TEXT,
            "content_hash": KEYWORD,
            "foreign_id": KEYWORD,
            "file_name": KEYWORD,
            "collection_id": KEYWORD,
            "uploader_id": KEYWORD,
            "children": KEYWORD,
            "source_url": KEYWORD,
            "extension": KEYWORD,
            "mime_type": KEYWORD,
            "encoding": KEYWORD,
            "entities": KEYWORD,
            "languages": KEYWORD,
            "countries": KEYWORD,
            "keywords": KEYWORD,
            "fingerprints": KEYWORD,
            "names": {
                "type": "keyword",
                "fields": {"text": RAW_TEXT}
            },
            "emails": KEYWORD,
            "phones": KEYWORD,
            "identifiers": KEYWORD,
            "addresses": {
                "type": "keyword",
                "fields": {"text": RAW_TEXT}
            },
            "columns": KEYWORD,
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"},
            "date": PARTIAL_DATE,
            "authored_at": PARTIAL_DATE,
            "modified_at": PARTIAL_DATE,
            "published_at": PARTIAL_DATE,
            "retrieved_at": PARTIAL_DATE,
            "dates": PARTIAL_DATE,
            "author": KEYWORD,
            "generator": KEYWORD,
            "summary": RAW_TEXT,
            "text": LATIN_TEXT,
            "properties": {
                "type": "object",
                "properties": schema_mapping
            },
            "parent": {
                "type": "object",
                "properties": {
                    "id": KEYWORD,
                    "type": KEYWORD,
                    "title": KEYWORD
                }
            },
            "ancestors": KEYWORD,
        }
    }
    settings = index_settings(shards=10)
    configure_index(entities_write_index(schema), mapping, settings)


def index_settings(shards=5, refresh_interval=None):
    return {
        "index": {
            "number_of_shards": shards,
            "refresh_interval": refresh_interval,
            "analysis": {
                "analyzer": {
                    "icu_latin": {
                        "tokenizer": "lowercase",
                        "filter": ["latinize"]
                    }
                },
                "filter": {
                    "latinize": {
                        "type": "icu_transform",
                        "id": "Any-Latin; NFD; [:Nonspacing Mark:] Remove; NFC"  # noqa
                    }
                }
            }
        }
    }
