from followthemoney import model
from followthemoney.util import merge_data

from aleph.core import es
from aleph.model import DossierMatch
from aleph.index.entities import finalize_index
from aleph.index.core import entities_index
from aleph.index.util import unpack_result


def generate_dossier(dossier_id, authz=None):
    """Generate a pseudo-entity composed of the combined properties of all
    entities mapped to the given dossier ID."""
    match_entities = set()
    distinct_entities = set()
    created_at, updated_at = None, None

    # Fetch the IDs for all included entities.
    for match in DossierMatch.decided_matches_by_id(dossier_id):
        # Resolve renames/redirects:
        dossier_id = match.dossier_id
        created_at = min(created_at, match.created_at)
        updated_at = max(updated_at, match.updated_at)

        # Make lists of matching and non-matching entities:
        if match.match is True:
            match_entities.add(match.entity_id)
        if match.match is False:
            distinct_entities.add(match.entity_id)

    schema = None
    data = {
        'id': dossier_id,
        'distinct': list(distinct_entities),
        'matches': [],
        'properties': {},
        'created_at': created_at,
        'updated_at': updated_at
    }
    result = es.mget(index=entities_index(),
                     doc_type='doc',
                     body={'ids': list(match_entities)},
                     _source={'exclude': ['text']})
    for doc in result.get('docs', []):
        entity = unpack_result(result)
        if entity is None:
            continue
        if authz is not None and not authz.match(entity.get('roles', [])):
            continue
        schema = model.precise_schema(schema, entity['schema'])
        data['matches'].append(data.get('id'))
        data['properties'] = merge_data(data['properties'],
                                        entity['properties'])

    # TODO: check links
    return finalize_index(data, schema, [])


def update_dossier(dossier_id):
    pass
