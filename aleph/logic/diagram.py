import logging
import json

from banal import ensure_list
from followthemoney import model
from followthemoney.util import get_entity_id
from followthemoney.types import registry
from followthemoney.exc import InvalidData

from aleph.model import Diagram, Entity
from aleph.logic.entities import (
    create_entity, update_entity, refresh_entity_id
)
from aleph.index import entities as index


log = logging.getLogger(__name__)


def create_diagram(data, collection, role_id):
    diagram_data = data.pop('data', None)
    if diagram_data:
        diagram_data = _normalize_data(diagram_data)
        layout = diagram_data.pop('layout')
        entities = layout.pop('entities')

        # Replace entitiy ids given by VIS with our own newly created signed
        # entity ids.
        signed_entity_ids = {}
        for ent in entities:
            ent = json.dumps(ent)
            for old_id, new_id in signed_entity_ids.items():
                ent = ent.replace(old_id, new_id)
            ent = json.loads(ent)
            # clear existing id if any
            ent.pop('foreign_id', None)
            signed_entity_id = create_entity(ent, collection)
            signed_entity_ids[ent['id']] = signed_entity_id
        data['entities'] = list(signed_entity_ids.values())

        # Do the same replacement in layout
        data['layout'] = _replace_ids(layout, signed_entity_ids)

    diagram = Diagram.create(data, collection, role_id)
    return diagram


def update_diagram(diagram, data, collection):
    diagram_data = data.pop('data', None)
    if diagram_data:
        diagram_data = _normalize_data(diagram_data)
        layout = diagram_data.pop('layout')
        entities = layout.pop('entities')

        existing_ids = diagram.entities
        signed_entity_ids = {}
        for ent in entities:
            ent = json.dumps(ent)
            for old_id, new_id in signed_entity_ids.items():
                ent = ent.replace(old_id, new_id)
            ent = json.loads(ent)
            ent_id = ent.get('id')
            # if it's an existing entity, update it
            if ent_id in existing_ids:
                entity = Entity.by_id(ent_id)
                entity.update(ent)
                update_entity(ent)
                signed_entity_ids[ent_id] = ent_id
            # if it's a new entity, create it
            else:
                # clear existing id if any
                ent.pop('foreign_id', None)
                signed_entity_id = create_entity(ent, collection)
                signed_entity_ids[ent_id] = signed_entity_id
        data['entities'] = list(signed_entity_ids.values())

        # Replace ids with signed ids in layout
        data['layout'] = _replace_ids(layout, signed_entity_ids)

        diagram.update(data=data)

        # If any of the existing entities are not in the current diagram,
        # delete them. Ideally we should store the diagram_id on entities
        # created by the diagram, so that we know which entities are orphaned.
        for ent_id in existing_ids:
            if ent_id not in diagram.entities:
                _delete_entity(ent_id)
    else:
        diagram.update(data=data)

    return diagram


def _replace_ids(layout, signed_entity_ids):
    layout = json.dumps(layout)
    for old_id, new_id in signed_entity_ids.items():
        layout = layout.replace(old_id, new_id)
    layout = json.loads(layout)
    return layout


def _normalize_data(data):
    """Turn entities in properties into entity ids"""
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
                        entity_id = get_entity_id(value)
                        properties[prop.name].append(entity_id)
    return data


def _delete_entity(entity_id):
    obj = Entity.by_id(entity_id)
    if obj is not None:
        obj.delete()
        index.delete_entity(entity_id)
        refresh_entity_id(entity_id)


def delete_diagram(diagram, flush_entities=False):
    # Clean up created entities
    if flush_entities:
        existing_ids = diagram.entities
        for ent_id in existing_ids:
            _delete_entity(ent_id)
    diagram.delete()
