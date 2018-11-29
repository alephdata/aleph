import logging
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from followthemoney import model
from followthemoney.util import merge_data
from urllib.parse import quote
from urlnormalizer import query_string

from aleph.core import db, url_for
from aleph.model import Audit
from aleph.logic.entities import create_entity, update_entity, delete_entity
from aleph.search import EntitiesQuery, MatchQuery
from aleph.search import SearchQueryParser
from aleph.logic.entities import entity_references, entity_tags
from aleph.logic.audit import record_audit
from aleph.views.util import get_index_entity, get_db_entity, get_db_collection
from aleph.views.util import jsonify, parse_request, serialize_data, get_flag
from aleph.views.cache import enable_cache
from aleph.serializers.entities import CombinedSchema
from aleph.serializers.entities import EntityCreateSchema, EntityUpdateSchema

log = logging.getLogger(__name__)
blueprint = Blueprint('entities_api', __name__)


@blueprint.route('/api/2/search', methods=['GET'])
@blueprint.route('/api/2/entities', methods=['GET'])
def index():
    parser = SearchQueryParser(request.args, request.authz)
    result = EntitiesQuery.handle(request,
                                  parser=parser,
                                  schema=CombinedSchema)
    enable_cache(vary_user=True, vary=result.cache_key)
    return jsonify(result)


@blueprint.route('/api/2/match', methods=['POST'])
def match():
    enable_cache()
    entity = parse_request(EntityUpdateSchema)
    entity = model.get_proxy(entity)
    result = MatchQuery.handle(request, entity=entity, schema=CombinedSchema)
    return jsonify(result)


@blueprint.route('/api/2/entities', methods=['POST', 'PUT'])
def create():
    data = parse_request(EntityCreateSchema)
    collection = get_db_collection(data['collection_id'], request.authz.WRITE)
    data = create_entity(data, collection, sync=get_flag('sync', True))
    return serialize_data(data, CombinedSchema)


@blueprint.route('/api/2/entities/<id>', methods=['GET'])
@blueprint.route('/api/2/documents/<id>', methods=['GET'])
def view(id):
    enable_cache()
    entity = get_index_entity(id, request.authz.READ)
    record_audit(Audit.ACT_ENTITY, id=id)
    return serialize_data(entity, CombinedSchema)


@blueprint.route('/api/2/entities/<id>/similar', methods=['GET'])
def similar(id):
    enable_cache()
    entity = get_index_entity(id, request.authz.READ)
    entity = model.get_proxy(entity)
    record_audit(Audit.ACT_ENTITY, id=id)
    result = MatchQuery.handle(request, entity=entity, schema=CombinedSchema)
    return jsonify(result)


@blueprint.route('/api/2/entities/<id>/references', methods=['GET'])
def references(id):
    enable_cache()
    entity = get_index_entity(id, request.authz.READ)
    record_audit(Audit.ACT_ENTITY, id=id)
    results = []
    for prop, total in entity_references(entity, request.authz):
        key = ('filter:properties.%s' % prop.name, id)
        link = url_for('entities_api.index', _query=(key,))
        results.append({
            'count': total,
            'property': prop,
            'schema': prop.schema.name,
            'results': link
        })
    return jsonify({
        'status': 'ok',
        'total': len(results),
        'results': results
    })


@blueprint.route('/api/2/entities/<id>/tags', methods=['GET'])
def tags(id):
    enable_cache()
    entity = get_index_entity(id, request.authz.READ)
    record_audit(Audit.ACT_ENTITY, id=id)
    results = []
    for (field, value, total) in entity_tags(entity, request.authz):
        qvalue = quote(value.encode('utf-8'))
        key = ('filter:%s' % field, qvalue)
        link = url_for('entities_api.index', _query=(key,))
        results.append({
            'id': query_string([key]),
            'value': value,
            'field': field,
            'count': total,
            'results': link
        })

    results.sort(key=lambda p: p['count'], reverse=True)
    return jsonify({
        'status': 'ok',
        'total': len(results),
        'results': results
    })


@blueprint.route('/api/2/entities/<id>', methods=['POST', 'PUT'])
def update(id):
    entity = get_db_entity(id, request.authz.WRITE)
    data = parse_request(EntityUpdateSchema)
    if get_flag('merge'):
        props = merge_data(data.get('properties'), entity.data)
        data['properties'] = props
    entity.update(data)
    db.session.commit()
    data = update_entity(entity, sync=get_flag('sync', True))
    return serialize_data(data, CombinedSchema)


@blueprint.route('/api/2/entities/<id>/merge/<other_id>', methods=['DELETE'])
def merge(id, other_id):
    entity = get_db_entity(id, request.authz.WRITE)
    other = get_db_entity(other_id, request.authz.WRITE)

    try:
        entity.merge(other)
    except ValueError as ve:
        raise BadRequest(ve.message)

    db.session.commit()
    sync = get_flag('sync', True)
    data = update_entity(entity, sync=sync)
    update_entity(other, sync=sync)
    return serialize_data(data, CombinedSchema)


@blueprint.route('/api/2/entities/<id>', methods=['DELETE'])
def delete(id):
    entity = get_db_entity(id, request.authz.WRITE)
    delete_entity(entity, sync=True)
    db.session.commit()
    return ('', 204)


# @blueprint.route('/api/2/entities/<id>/graph', methods=['GET'])
# def graph(id):
#     update = request.args.get('update') == 'true'
#     entity = export_node(id, update=update)
#     resp = jsonify(entity)
#     # resp.headers["Access-Control-Allow-Origin"] = "*"
#     return resp
