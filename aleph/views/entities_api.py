import logging
from flask import Blueprint, request, Response
from werkzeug.exceptions import BadRequest
from followthemoney import model
from followthemoney.types import registry
from followthemoney.util import merge_data
from urllib.parse import quote
from urlnormalizer import query_string

from aleph.core import db
from aleph.model import Audit
from aleph.logic.entities import create_entity, update_entity, delete_entity
from aleph.search import EntitiesQuery, MatchQuery, SearchQueryParser
from aleph.logic.entities import entity_references, entity_tags
from aleph.index.entities import entities_by_ids
from aleph.logic.audit import record_audit
from aleph.views.util import get_index_entity, get_db_entity, get_db_collection
from aleph.views.util import jsonify, parse_request, get_flag, sanitize_html
from aleph.views.cache import enable_cache
from aleph.views.serializers import EntitySerializer
from aleph.views.forms import EntityCreateSchema, EntityUpdateSchema

from aleph.views.export import export_entities

log = logging.getLogger(__name__)
blueprint = Blueprint('entities_api', __name__)


@blueprint.route('/api/2/search', methods=['GET'])
@blueprint.route('/api/2/entities', methods=['GET'])
def index():
    # enable_cache(vary_user=True)
    parser = SearchQueryParser(request.args, request.authz)
    result = EntitiesQuery.handle(request, parser=parser)
    return EntitySerializer.jsonify_result(result)


@blueprint.route('/api/2/search/export/<any(csv, excel):format>', methods=['GET'])  # noqa
@blueprint.route('/api/2/entities/export/<any(csv, excel):format>', methods=['GET'])  # noqa
def export(format):
    parser = SearchQueryParser(request.args, request.authz)
    result = EntitiesQuery.handle(request, parser=parser)
    results = result.to_dict(serializer=EntitySerializer)['results']
    entities = [model.get_proxy(ent) for ent in results]
    response = Response(
        export_entities(entities, format), mimetype='application/zip'
    )
    response.headers['Content-Disposition'] = 'attachment; filename={}'.format('export.zip')  # noqa
    return response


@blueprint.route('/api/2/match', methods=['POST'])
def match():
    entity = parse_request(EntityUpdateSchema)
    record_audit(Audit.ACT_MATCH, entity=entity)
    entity = model.get_proxy(entity)
    collection_ids = request.args.getlist('collection_ids')
    result = MatchQuery.handle(request, entity=entity,
                               collection_ids=collection_ids)
    return EntitySerializer.jsonify_result(result)


@blueprint.route('/api/2/entities', methods=['POST', 'PUT'])
def create():
    data = parse_request(EntityCreateSchema)
    collection = get_db_collection(data['collection_id'], request.authz.WRITE)
    data = create_entity(data, collection, sync=get_flag('sync', True))
    return EntitySerializer.jsonify(data)


@blueprint.route('/api/2/documents/<entity_id>', methods=['GET'])
@blueprint.route('/api/2/entities/<entity_id>', methods=['GET'])
def view(entity_id):
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    record_audit(Audit.ACT_ENTITY, id=entity_id)
    return EntitySerializer.jsonify(entity)


@blueprint.route('/api/2/entities/<entity_id>/content', methods=['GET'])
def content(entity_id):
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    for entity in entities_by_ids([entity_id],
                                  schemata=entity.get('schema'),
                                  excludes=['text']):
        proxy = model.get_proxy(entity)
        record_audit(Audit.ACT_ENTITY, id=entity_id)
        html = sanitize_html(proxy.first('bodyHtml', quiet=True),
                             proxy.first('sourceUrl', quiet=True))
        headers = proxy.first('headers', quiet=True)
        headers = registry.json.unpack(headers)
        return jsonify({
            'headers': headers,
            'text': proxy.first('bodyText', quiet=True),
            'html': html
        })
    return ('', 404)


@blueprint.route('/api/2/entities/<entity_id>/similar', methods=['GET'])
def similar(entity_id):
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    entity = model.get_proxy(entity)
    record_audit(Audit.ACT_ENTITY, id=entity_id)
    result = MatchQuery.handle(request, entity=entity)
    return EntitySerializer.jsonify_result(result)


@blueprint.route('/api/2/entities/<entity_id>/references', methods=['GET'])
def references(entity_id):
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    record_audit(Audit.ACT_ENTITY, id=entity_id)
    results = []
    for prop, total in entity_references(entity, request.authz):
        results.append({
            'count': total,
            'property': prop,
            'schema': prop.schema.name,
        })
    return jsonify({
        'status': 'ok',
        'total': len(results),
        'results': results
    })


@blueprint.route('/api/2/entities/<entity_id>/tags', methods=['GET'])
def tags(entity_id):
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    record_audit(Audit.ACT_ENTITY, id=entity_id)
    results = []
    for (field, value, total) in entity_tags(entity, request.authz):
        qvalue = quote(value.encode('utf-8'))
        key = ('filter:%s' % field, qvalue)
        results.append({
            'id': query_string([key]),
            'value': value,
            'field': field,
            'count': total,
        })

    results.sort(key=lambda p: p['count'], reverse=True)
    return jsonify({
        'status': 'ok',
        'total': len(results),
        'results': results
    })


@blueprint.route('/api/2/entities/<entity_id>', methods=['POST', 'PUT'])
def update(entity_id):
    entity = get_db_entity(entity_id, request.authz.WRITE)
    data = parse_request(EntityUpdateSchema)
    if get_flag('merge'):
        props = merge_data(data.get('properties'), entity.data)
        data['properties'] = props
    entity.update(data)
    db.session.commit()
    data = update_entity(entity, sync=get_flag('sync', True))
    return EntitySerializer.jsonify(data)


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
    return EntitySerializer.jsonify(data)


@blueprint.route('/api/2/entities/<entity_id>', methods=['DELETE'])
def delete(entity_id):
    entity = get_db_entity(entity_id, request.authz.WRITE)
    delete_entity(entity, sync=True)
    db.session.commit()
    return ('', 204)
