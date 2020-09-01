import logging
from pprint import pprint  # noqa
from banal import hash_data, ensure_list
from datetime import datetime
from followthemoney.types import registry
from elasticsearch.helpers import scan

from aleph.core import settings, es
from aleph.index.util import index_name, index_settings, configure_index
from aleph.index.util import query_delete, bulk_actions, unpack_result
from aleph.index.util import authz_query
from aleph.index.util import KEYWORD, SHARDS_HEAVY

log = logging.getLogger(__name__)


def xref_index():
    return index_name("xref", settings.INDEX_WRITE)


def configure_xref():
    mapping = {
        "date_detection": False,
        "dynamic": False,
        "properties": {
            "score": {"type": "float"},
            "entity_id": KEYWORD,
            "collection_id": KEYWORD,
            "match_id": KEYWORD,
            "match_collection_id": KEYWORD,
            registry.country.group: KEYWORD,
            "schema": KEYWORD,
            "text": {"type": "text", "analyzer": "latin_index"},
            "created_at": {"type": "date"},
        },
    }
    settings = index_settings(shards=SHARDS_HEAVY)
    return configure_index(xref_index(), mapping, settings)


def _index_form(collection, matches):
    now = datetime.utcnow().isoformat()
    for (score, entity, match_collection_id, match) in matches:
        xref_id = hash_data((entity.id, collection.id, match.id))
        text = ensure_list(entity.get_type_values(registry.name))
        text.extend(match.get_type_values(registry.name))
        yield {
            "_id": xref_id,
            "_index": xref_index(),
            "_source": {
                "score": score,
                "entity_id": entity.id,
                "collection_id": collection.id,
                "match_id": match.id,
                "match_collection_id": match_collection_id,
                "countries": match.get_type_values(registry.country),
                "schema": match.schema.name,
                "text": text,
                "created_at": now,
            },
        }


def index_matches(collection, matches, sync=False):
    """Index cross-referencing matches."""
    bulk_actions(_index_form(collection, matches), sync=sync)


def iter_matches(collection, authz):
    """Scan all matching xref results, does not support sorting."""
    filters = [
        {"term": {"collection_id": collection.id}},
        authz_query(authz, field="match_collection_id"),
    ]
    query = {"query": {"bool": {"filter": filters}}}
    for res in scan(es, index=xref_index(), query=query):
        yield unpack_result(res)


def get_xref(xref_id, collection_id=None):
    """Get an xref match combo by its ID."""
    filters = [{"ids": {"values": [xref_id]}}]
    if collection_id is not None:
        filters.append({"term": {"collection_id": collection_id}})
    query = {"query": {"bool": {"filter": filters}}, "size": 1}
    result = es.search(index=xref_index(), body=query)
    for doc in result.get("hits", {}).get("hits", []):
        return unpack_result(doc)


def delete_xref(collection, entity_id=None, sync=False):
    """Delete xref matches of an entity or a collection."""
    shoulds = [
        {"term": {"collection_id": collection.id}},
        {"term": {"match_collection_id": collection.id}},
    ]
    if entity_id is not None:
        shoulds = [
            {"term": {"entity_id": entity_id}},
            {"term": {"match_id": entity_id}},
        ]
    query = {"bool": {"should": shoulds, "minimum_should_match": 1}}
    query_delete(xref_index(), query, sync=sync)
