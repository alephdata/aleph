import logging
import json

from banal import ensure_list
from followthemoney import model
from followthemoney.util import get_entity_id
from followthemoney.types import registry
from followthemoney.exc import InvalidData

from aleph.model import Diagram, Entity
from aleph.logic.entities import create_entity, update_entity, refresh_entity
from aleph.index import entities as index


log = logging.getLogger(__name__)


def create_diagram(data, collection, role_id):
    data = data.get('data')
    data = _normalize_data(data)
    entities = data['layout']['entities']
    signed_entity_ids = {}
    for ent in entities:
        ent = json.dumps(ent)
        for old_id, new_id in signed_entity_ids.items():
            ent = ent.replace(old_id, new_id)
        ent = json.loads(ent)
        signed_entity_id = create_entity(ent, collection)
        signed_entity_ids[ent['id']] = signed_entity_id
    data = json.dumps(data)
    for old_id, new_id in signed_entity_ids.items():
        data = data.replace(old_id, new_id)
    data = json.loads(data)
    data["layout"]['entities'] = list(signed_entity_ids.values())
    diagram = Diagram.create(data, collection, role_id)
    return diagram


def update_diagram(diagram, data, collection):
    data = data.get('data')
    data = _normalize_data(data)
    entities = data['layout']['entities']
    existing_ids = diagram.entity_ids
    signed_entity_ids = {}
    for ent in entities:
        ent = json.dumps(ent)
        for old_id, new_id in signed_entity_ids.items():
            ent = ent.replace(old_id, new_id)
        ent = json.loads(ent)
        ent_id = ent.get('id')
        if ent_id in existing_ids:
            entity = Entity.by_id(ent_id)
            entity.update(ent)
            update_entity(ent)
            signed_entity_ids[ent_id] = ent_id
        else:
            signed_entity_id = create_entity(ent, collection)
            signed_entity_ids[ent_id] = signed_entity_id
    data = json.dumps(data)
    for old_id, new_id in signed_entity_ids.items():
        data = data.replace(old_id, new_id)
    data = json.loads(data)
    diagram.update(data=data)
    # If any of the existing entities are not in the current diagram, delete
    # them. Ideally we should store the diagram_id on entities created by the
    # diagram, so that we know which entities are orphaned.
    for ent_id in existing_ids:
        if ent_id not in diagram.entity_ids:
            _delete_entity(ent_id)
    return diagram


def _normalize_data(data):
    entities = data['layout']['entities']
    for obj in entities:
        schema = model.get(obj.get('schema'))
        if schema is None:
            raise InvalidData("Invalid schema %s" % obj.get('schema'))
        properties = obj.get('properties', {})
        for prop in schema.properties.values():
            if prop.type == registry.entity:
                values = ensure_list(properties.get(prop.name))
                if values:
                    properties[prop.name] = []
                    for value in values:
                        entity = get_entity_id(value)
                        properties[prop.name].append(entity)
    return data


def _delete_entity(entity_id):
    obj = Entity.by_id(entity_id)
    if obj is not None:
        proxy = obj.to_proxy()
        obj.delete()
        index.delete_entity(entity_id)
        refresh_entity(proxy)


def delete_diagram(diagram):
    existing_ids = diagram.entity_ids
    # Clean up created entities
    for ent_id in existing_ids:
        _delete_entity(ent_id)
    diagram.delete()
