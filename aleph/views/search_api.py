from flask import Blueprint, request
from apikit import jsonify
from apikit import get_limit, get_offset

from aleph.model.metadata import CORE_FACETS
from aleph.views.cache import etag_cache_keygen
from aleph.search import construct_query, execute_query

blueprint = Blueprint('search', __name__)


# def transform_facets(aggregations):
#     coll = aggregations.get('all', {}).get('ftr', {}).get('collections', {})
#     coll = coll.get('buckets', [])

#     lists = {}
#     for list_id in get_list_facets(request.args):
#         key = 'list_%s' % list_id
#         ents = aggregations.get(key, {}).get('inner', {})
#         ents = ents.get('entities', {}).get('buckets', [])
#         objs = Entity.by_id_set([e.get('key') for e in ents])
#         entities = []
#         for entity in ents:
#             entity['entity'] = objs.get(entity.get('key'))
#             if entity['entity'] is not None:
#                 entities.append(entity)
#         lists[list_id] = entities

#     return {
#         'sources': coll,
#         'lists': lists
#     }


@blueprint.route('/api/1/query')
def query():
    etag_cache_keygen()
    query = construct_query(request.args)
    query['size'] = get_limit()
    query['from'] = get_offset()
    return jsonify(execute_query(request.args, query))


@blueprint.route('/api/1/fields')
def attributes():
    etag_cache_keygen()
    return jsonify(CORE_FACETS)
