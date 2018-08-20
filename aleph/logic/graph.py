import hashlib
import logging
from pprint import pprint  # noqa
from followthemoney import model

from aleph.core import settings, kv
from aleph.index.entities import iter_entities

log = logging.getLogger(__name__)


def load_into_redis(collection_id):
    ftm_properties = {}
    for prop in model.properties:
        ftm_properties[prop.name] = {
            'label': prop.label,
            'reverse': prop.reverse,
            'schema': prop.schema.name,
        }
    count = 0
    queue_len = 0
    pipe = kv.pipeline()
    for entity in iter_entities(collection_id=collection_id,
                                excludes=['text']):
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
            pipe = kv.pipeline()
    log.info("Stored %s entities." % count)
    pipe.execute()


def export_node(entity_id, update=False):
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
                "labels": [kv.get("schema:" + entity_id)] or ["Thing"],
                "properties": {},
            })
            added_nodes = {entity_id, }
        links = kv.hgetall(entity_id)
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
            for obj in kv.hkeys(rel + ":" + entity_id):
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
