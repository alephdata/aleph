import logging

from banal import ensure_list
from followthemoney import model
from followthemoney.util import get_entity_id
from followthemoney.types import registry
from followthemoney.exc import InvalidData

log = logging.getLogger(__name__)


def replace_layout_ids(layout, old_to_new_id_map):
    # Replace ids in vertices
    for vtx in layout['vertices']:
        ent_id = vtx.get('entityId')
        if ent_id is not None and ent_id in old_to_new_id_map:
            new_id = old_to_new_id_map[ent_id]
            vtx['entityId'] = new_id
            vtx['id'] = vtx['id'].replace(ent_id, new_id)
    # Replaces ids in edges
    for edge in layout['edges']:
        keys = ('sourceId', 'targetId')
        for key in keys:
            if edge[key].startswith('entity'):
                old_id = edge[key].split('entity:')[-1]
                if old_id in old_to_new_id_map:
                    new_id = old_to_new_id_map[old_id]
                    edge[key] = "entity:%s" % new_id
                    edge['id'] = edge['id'].replace(old_id, new_id)
        ent_id = edge.get('entityId')
        if ent_id in old_to_new_id_map:
            new_id = old_to_new_id_map[ent_id]
            edge['entityId'] = new_id
            edge['id'] = edge['id'].replace(ent_id, new_id)
    # Replace ids in groupings
    for group in layout['groupings']:
        vertices = []
        for vtx in group['vertices']:
            if vtx.startswith('entity'):
                old_id = vtx.split('entity:')[-1]
                if old_id in old_to_new_id_map:
                    new_id = old_to_new_id_map[old_id]
                    group['id'] = group['id'].replace(old_id, new_id)
                    vtx = "entity:%s" % new_id
            vertices.append(vtx)
        group['vertices'] = vertices
    return layout


def replace_entity_ids(entity_data, old_to_new_id_map):
    """Replace ids with signed ids in entity data"""
    schema = model.get(entity_data.get('schema'))
    if schema is None:
        raise InvalidData("Invalid schema %s" % entity_data.get('schema'))
    properties = entity_data.get('properties', {})
    for prop in schema.properties.values():
        if prop.type == registry.entity:
            values = ensure_list(properties.get(prop.name))
            if values:
                properties[prop.name] = []
                for value in values:
                    entity_id = get_entity_id(value)
                    if entity_id in old_to_new_id_map:
                        entity_id = old_to_new_id_map[entity_id]
                    properties[prop.name].append(entity_id)
    return entity_data
