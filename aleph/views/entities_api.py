from banal import as_bool
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from followthemoney.util import merge_data
from six.moves.urllib.parse import quote
from urlnormalizer import query_string

from aleph.core import db, url_for
from aleph.model import Entity
from aleph.logic.entities import update_entity, delete_entity
from aleph.logic.collections import update_collection
from aleph.search import EntitiesQuery, EntityDocumentsQuery
from aleph.search import SuggestEntitiesQuery, SimilarEntitiesQuery
from aleph.logic.entities import entity_references, entity_tags
from aleph.views.util import get_index_entity, get_db_entity, get_db_collection
from aleph.views.util import jsonify, parse_request
from aleph.views.cache import enable_cache
from aleph.serializers.entities import CombinedSchema
from aleph.serializers.entities import EntityCreateSchema, EntityUpdateSchema

blueprint = Blueprint('entities_api', __name__)


@blueprint.route('/api/2/entities', methods=['GET'])
def index():
    enable_cache()
    result = EntitiesQuery.handle(request, schema=CombinedSchema)
    return jsonify(result)


@blueprint.route('/api/2/entities/_suggest', methods=['GET'])
def suggest():
    enable_cache()
    result = SuggestEntitiesQuery.handle(request, schema=CombinedSchema)
    return jsonify(result)


@blueprint.route('/api/2/entities', methods=['POST', 'PUT'])
def create():
    data = parse_request(EntityCreateSchema)
    collection = get_db_collection(data['collection_id'], request.authz.WRITE)
    entity = Entity.create(data, collection)
    db.session.commit()
    data = update_entity(entity)
    update_collection(collection)
    return jsonify(data, schema=CombinedSchema)


@blueprint.route('/api/2/entities/<id>', methods=['GET'])
def view(id):
    entity = get_index_entity(id, request.authz.READ)
    return jsonify(entity, schema=CombinedSchema)


@blueprint.route('/api/2/entities/<id>/similar', methods=['GET'])
def similar(id):
    enable_cache()
    entity = get_index_entity(id, request.authz.READ)
    result = SimilarEntitiesQuery.handle(request,
                                         entity=entity,
                                         schema=CombinedSchema)
    return jsonify(result)


@blueprint.route('/api/2/entities/<id>/documents', methods=['GET'])
def documents(id):
    enable_cache()
    entity = get_index_entity(id, request.authz.READ)
    result = EntityDocumentsQuery.handle(request,
                                         entity=entity,
                                         schema=CombinedSchema)
    return jsonify(result)


@blueprint.route('/api/2/entities/<id>/references', methods=['GET'])
def references(id):
    enable_cache()
    entity = get_index_entity(id, request.authz.READ)
    results = []
    for prop, total in entity_references(entity, request.authz):
        key = ('filter:properties.%s' % prop.name, id)
        link = url_for('search_api.search', _query=(key,))
        results.append({
            'count': total,
            'property': prop,
            'schema': prop.schema.name,
            'results': link
        })
    return jsonify({
        'status': 'ok',
        'results': results
    })


@blueprint.route('/api/2/entities/<id>/tags', methods=['GET'])
def tags(id):
    enable_cache()
    entity = get_index_entity(id, request.authz.READ)
    results = []
    for (field, value, total) in entity_tags(entity, request.authz):
        qvalue = quote(value.encode('utf-8'))
        key = ('filter:%s' % field, qvalue)
        link = url_for('search_api.search', _query=(key,))
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
    if as_bool(request.args.get('merge')):
        props = merge_data(data.get('properties'), entity.data)
        data['properties'] = props
    entity.update(data)
    db.session.commit()
    data = update_entity(entity)
    update_collection(entity.collection)
    return jsonify(data, schema=CombinedSchema)


@blueprint.route('/api/2/entities/<id>', methods=['DELETE'])
def delete(id):
    entity = get_db_entity(id, request.authz.WRITE)
    delete_entity(entity)
    db.session.commit()
    update_collection(entity.collection)
    return jsonify({'status': 'ok'}, status=410)
