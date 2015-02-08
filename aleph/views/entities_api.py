from flask import Blueprint, request
from flask.ext.login import current_user
from werkzeug.exceptions import BadRequest

from aleph.views.util import obj_or_404, jsonify, Pager
from aleph.processing import refresh_selectors
from aleph.model import Entity, List, db
from aleph import authz

blueprint = Blueprint('entities', __name__)


@blueprint.route('/api/1/entities', methods=['GET'])
def index():
    list_ids = List.user_list_ids(current_user)
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


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    lists = authz.authz_lists('read')
    prefix = request.args.get('prefix')
    results = Entity.suggest_prefix(prefix, lists)
    return jsonify({'results': results})


@blueprint.route('/api/1/entities/<id>', methods=['GET'])
def view(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.list_read(entity.list_id))
    return jsonify(entity)


@blueprint.route('/api/1/entities/<id>', methods=['DELETE'])
def delete(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.list_write(entity.list_id))
    selectors = entity.terms
    entity.delete()
    db.session.commit()
    if len(selectors):
        refresh_selectors.delay(selectors)
    return jsonify({'status': 'ok'})
