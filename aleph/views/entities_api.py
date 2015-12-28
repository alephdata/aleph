from flask import Blueprint, request
from flask.ext.login import current_user
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, jsonify, Pager, request_data

from aleph.model import Entity, db
from aleph.model.forms import EntityForm
from aleph.analyze import analyze_terms
from aleph import authz

blueprint = Blueprint('entities', __name__)


@blueprint.route('/api/1/entities', methods=['GET'])
def index():
    list_ids = authz.lists(authz.READ)
    filter_lists = request.args.getlist('list')
    if len(filter_lists):
        try:
            filter_lists = [int(f) for f in filter_lists]
            list_ids = [l for l in list_ids if l in filter_lists]
        except ValueError:
            raise BadRequest()

    prefix = request.args.get('prefix')
    q = Entity.by_lists(list_ids, prefix=prefix)
    return jsonify(Pager(q))


@blueprint.route('/api/1/entities', methods=['POST', 'PUT'])
def create():
    data = EntityForm().deserialize(request_data())
    authz.require(data['list'])
    authz.require(authz.list_write(data['list'].id))
    entity = Entity.create(data, current_user)
    db.session.commit()
    analyze_terms.delay(list(entity.terms))
    return view(entity.id)


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    lists = authz.lists(authz.READ)
    prefix = request.args.get('prefix')
    results = Entity.suggest_prefix(prefix, lists)
    return jsonify({'results': results})


@blueprint.route('/api/1/entities/<id>', methods=['GET'])
def view(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.list_read(entity.list_id))
    return jsonify(entity)


@blueprint.route('/api/1/entities/<id>', methods=['POST', 'PUT'])
def update(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.list_write(entity.list_id))
    data = EntityForm().deserialize(request_data())
    authz.require(data['list'])
    authz.require(authz.list_write(data['list'].id))
    terms = entity.terms
    entity.update(data)
    db.session.commit()
    terms.update(entity.terms)
    analyze_terms.delay(terms)
    return view(entity.id)


@blueprint.route('/api/1/entities/<id>', methods=['DELETE'])
def delete(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.list_write(entity.list_id))
    terms = list(entity.terms)
    entity.delete()
    db.session.commit()
    analyze_terms.delay(terms)
    return jsonify({'status': 'ok'})
