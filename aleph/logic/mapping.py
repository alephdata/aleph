import logging

from flask import request
from werkzeug.exceptions import BadRequest

from aleph.core import archive
from aleph.views.util import get_index_entity
from aleph.views.serializers import first


log = logging.getLogger(__name__)


def load_query():
    try:
        query = request.json.get('mapping_query', '{}')
        # TODO: validate query
    except Exception as ex:
        raise BadRequest(str(ex))
    return query


def get_mapping_query(mapping):
    table = get_index_entity(mapping.table_id, request.authz.READ)
    properties = table.get('properties', {})
    csv_hash = first(properties.get('csvHash'))
    query = {
        'entities': mapping.entities_query
    }
    url = None
    if csv_hash:
        url = archive.generate_url(csv_hash)
        if not url:
            local_path = archive.load_file(csv_hash)
            if local_path is not None:
                url = local_path.as_posix()
        if url is not None:
            query['csv_url'] = url
            return {
                'query': query,
                'mapping_id': mapping.id,
                'proof_id': mapping.table_id,
            }
        raise BadRequest("Could not generate csv url for the table")
    raise BadRequest("Source table doesn't have a csvHash")
