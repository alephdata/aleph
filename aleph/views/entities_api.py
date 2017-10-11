from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from apikit import arg_bool

from aleph.core import db
from aleph.model import Entity
from aleph.model.common import merge_data
from aleph.logic.entities import update_entity, delete_entity
from aleph.logic.collections import update_collection
from aleph.search import LinksQuery, EntitiesQuery, EntityDocumentsQuery
from aleph.search import SuggestEntitiesQuery, SimilarEntitiesQuery
from aleph.search import DatabaseQueryResult, QueryParser
from aleph.views.util import get_entity, get_collection, jsonify, parse_request
from aleph.views.cache import enable_cache
from aleph.views.serializers import EntitySchema, LinkSchema, DocumentSchema

blueprint = Blueprint('entities_api', __name__)


@blueprint.route('/api/2/entities', methods=['GET'])
def index():
    enable_cache()
    result = EntitiesQuery.handle_request(request, schema=EntitySchema)
    return jsonify(result)


@blueprint.route('/api/2/entities/_all', methods=['GET'])
def all():
    parser = QueryParser(request.args, request.authz)
    q = Entity.all_ids(authz=request.authz)
    q = q.filter(Entity.state == Entity.STATE_ACTIVE)
    collection_ids = parser.getintlist('collection_id')
    if len(collection_ids):
        q = q.filter(Entity.collection_id.in_(collection_ids))
    result = DatabaseQueryResult(request, q, parser=parser)
    return jsonify(result)


@blueprint.route('/api/2/entities/_suggest', methods=['GET'])
def suggest():
    enable_cache()
    result = SuggestEntitiesQuery.handle_request(request, schema=EntitySchema)
    return jsonify(result)


@blueprint.route('/api/2/entities', methods=['POST', 'PUT'])
def create():
    data = parse_request(schema=EntitySchema)
    collection = get_collection(data.get('collection_id'),
                                request.authz.WRITE)
    entity = Entity.create(data, collection)
    db.session.commit()
    update_entity(entity)
    update_collection(collection)
    return view(entity.id)


@blueprint.route('/api/2/entities/<id>', methods=['GET'])
def view(id):
    entity, obj = get_entity(id, request.authz.READ)
    return jsonify(entity, schema=EntitySchema)


@blueprint.route('/api/2/entities/<id>/links', methods=['GET'])
def links(id):
    enable_cache()
    entity, obj = get_entity(id, request.authz.READ)
    result = LinksQuery.handle_request(request,
                                       entity=entity,
                                       schema=LinkSchema)
    return jsonify(result)


@blueprint.route('/api/2/entities/<id>/similar', methods=['GET'])
def similar(id):
    enable_cache()
    entity, _ = get_entity(id, request.authz.READ)
    result = SimilarEntitiesQuery.handle_request(request,
                                                 entity=entity,
                                                 schema=EntitySchema)
    return jsonify(result)


@blueprint.route('/api/2/entities/<id>/documents', methods=['GET'])
def documents(id):
    enable_cache()
    entity, _ = get_entity(id, request.authz.READ)
    result = EntityDocumentsQuery.handle_request(request,
                                                 entity=entity,
                                                 schema=DocumentSchema)
    return jsonify(result)


@blueprint.route('/api/2/entities/<id>', methods=['POST', 'PUT'])
def update(id):
    _, entity = get_entity(id, request.authz.WRITE)
    data = parse_request(schema=EntitySchema)
    if arg_bool('merge'):
        data['data'] = merge_data(data.get('data') or {},
                                  entity.data or {})
    entity.update(data)
    db.session.commit()
    update_entity(entity)
    update_collection(entity.collection)
    return view(entity.id)


@blueprint.route('/api/2/entities/<id>/merge/<other_id>', methods=['DELETE'])
def merge(id, other_id):
    _, entity = get_entity(id, request.authz.WRITE)
    _, other = get_entity(other_id, request.authz.WRITE)

    try:
        entity.merge(other)
    except ValueError as ve:
        raise BadRequest(ve.message)

    db.session.commit()
    update_entity(entity)
    update_entity(other)
    update_collection(entity.collection)
    return view(entity.id)


@blueprint.route('/api/2/entities/<id>', methods=['DELETE'])
def delete(id):
    _, entity = get_entity(id, request.authz.WRITE)
    delete_entity(entity)
    update_collection(entity.collection)
    db.session.commit()
    return jsonify({'status': 'ok'}, status=410)
