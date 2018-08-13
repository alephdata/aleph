from pprint import pprint  # noqa
import hashlib
import logging

from elasticsearch.helpers import scan
from followthemoney import model

from aleph.core import es, connect_redis
from aleph.index.core import entities_index
from aleph.index.util import unpack_result
from aleph import settings

log = logging.getLogger(__name__)


def load_into_redis(collection_id):
    q = {'term': {'collection_id': collection_id}}
    q = {
        'query': q,
        '_source': {'exclude': ['text']}
    }
    ftm_properties = {}
    for prop in model.properties:
        ftm_properties[prop.name] = {
            'label': prop.label,
            'reverse': prop.reverse,
            'schema': prop.schema.name,
        }
    count = 0
    queue_len = 0
    conn = connect_redis()
    pipe = conn.pipeline()
    for row in scan(es, index=entities_index(), query=q):
        entity = unpack_result(row)
        entity_id = entity['id']
        schema = entity['schema']
        properties = entity['properties']
        pipe.set("schema:" + entity_id, schema)
        for key, val in properties.items():
            prop = ftm_properties.get(key)
            if not prop:
                continue
            label = prop.get('label')
            reverse = prop.get('reverse')
            for v in val:
                if label:
                    pipe.hset(entity_id, label + ':' + v, 1)
                if reverse:
                    pipe.hset(reverse + ':' + v, entity_id, 1)
        count += 1
        queue_len += 1
        if queue_len >= settings.REDIS_BATCH_SIZE:
            pipe.execute()
            log.info("Stored %s entities so far." % count)
            queue_len = 0
            pipe = conn.pipeline()
    log.info("Stored %s entities." % count)
    pipe.execute()


def export_node(entity_id, update=False):
    conn = connect_redis()
    relation_schema_map = {}
    for schema in model.schemata.values():
        for prop in schema.properties.values():
            if prop.reverse:
                relation_schema_map[prop.reverse] = schema.name
            if prop.range:
                if relation_schema_map.get(prop.label):
                    existing = model.schemata.get(
                        relation_schema_map.get(prop.label)
                    )
                    incoming = model.schemata.get(prop.range)
                    # Not interested in broader schemas
                    if existing.is_a(incoming):
                        continue
                relation_schema_map[prop.label] = prop.range
    graph = {
        "nodes": [],
        "relationships": [],
    }
    if entity_id is not None:
        added_nodes = {}
        if not update:
            graph["nodes"].append({
                "id": entity_id,
                "labels": [conn.get("schema:" + entity_id)] or ["Thing"],
                "properties": {},
            })
            added_nodes = {entity_id, }
        links = conn.hgetall(entity_id)
        for link in links:
            rel, obj = link.split(":", 1)
            if obj not in added_nodes:
                node = {
                    "id": obj,
                    "labels": [relation_schema_map[rel]],
                    "properties": {},
                }
                graph["nodes"].append(node)
            rel_hash = hashlib.md5(rel.encode('utf-8'))
            rel_hash.update(entity_id.encode('utf-8'))
            rel_hash.update(obj.encode('utf-8'))
            graph["relationships"].append({
                "id": rel_hash.hexdigest(),
                "type": rel,
                "startNode": entity_id,
                "endNode": obj,
                "properties": {},
            })
        for rel in relation_schema_map:
            for obj in conn.hkeys(rel + ":" + entity_id):
                if obj not in added_nodes:
                    graph["nodes"].append({
                        "id": obj,
                        "labels": [relation_schema_map[rel]],
                        "properties": {},
                    })
                rel_hash = hashlib.md5(rel.encode('utf-8'))
                rel_hash.update(entity_id.encode('utf-8'))
                rel_hash.update(obj.encode('utf-8'))
                graph["relationships"].append({
                    "id": rel_hash.hexdigest(),
                    "type": rel,
                    "startNode": entity_id,
                    "endNode": obj,
                    "properties": {},
                })
    return {
        "results": [
            {
                "data": [{"graph": graph}]
            }
        ],
    }
