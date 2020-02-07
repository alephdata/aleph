import logging

log = logging.getLogger(__name__)


def replace_layout_ids(layout, old_to_new_id_map):
    # Replace ids in vertices
    for vtx in layout.get('vertices', []):
        ent_id = vtx.get('entityId')
        if ent_id in old_to_new_id_map:
            new_id = old_to_new_id_map[ent_id]
            vtx['entityId'] = new_id
            vtx['id'] = vtx['id'].replace(ent_id, new_id)
    # Replaces ids in edges
    for edge in layout.get('edges', []):
        for key in ('sourceId', 'targetId'):
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
    for group in layout.get('groupings', []):
        vertices = []
        for vtx in group.get('vertices', []):
            if vtx.startswith('entity'):
                old_id = vtx.split('entity:')[-1]
                if old_id in old_to_new_id_map:
                    new_id = old_to_new_id_map[old_id]
                    group['id'] = group['id'].replace(old_id, new_id)
                    vtx = "entity:%s" % new_id
            vertices.append(vtx)
        group['vertices'] = vertices
    return layout
