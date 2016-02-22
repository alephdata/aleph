from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, jsonify, Pager, request_data

from aleph import authz
from aleph.model import Entity, db
from aleph.model.forms import EntityForm
from aleph.analyze import analyze_entity
from aleph.views.cache import enable_cache

blueprint = Blueprint('entities', __name__)


@blueprint.route('/api/1/entities', methods=['GET'])
def index():
    watchlist_ids = authz.watchlists(authz.READ)
    filter_lists = request.args.getlist('watchlist')
    if len(filter_lists):
        try:
            filter_lists = [int(f) for f in filter_lists]
            watchlist_ids = [l for l in watchlist_ids if l in filter_lists]
        except ValueError:
            raise BadRequest()

    prefix = request.args.get('prefix')
    q = Entity.by_lists(watchlist_ids, prefix=prefix)
    return jsonify(Pager(q))


@blueprint.route('/api/1/entities', methods=['POST', 'PUT'])
def create():
    data = EntityForm().deserialize(request_data())
    watchlist = data.get('watchlist')
    authz.require(watchlist)
    authz.require(authz.watchlist_write(watchlist.id))
    entity = Entity.create(data)
    watchlist.touch()
    db.session.commit()
    analyze_entity.delay(entity.id)
    return view(entity.id)


@blueprint.route('/api/1/entities/_suggest', methods=['GET'])
def suggest():
    watchlists = authz.watchlists(authz.READ)
    enable_cache(vary=watchlists, server_side=False)
    prefix = request.args.get('prefix')
    results = Entity.suggest_prefix(prefix, watchlists)
    return jsonify({'results': results})


@blueprint.route('/api/1/entities/<int:id>', methods=['GET'])
def view(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.watchlist_read(entity.watchlist_id))
    return jsonify(entity)


@blueprint.route('/api/1/entities/<int:id>', methods=['POST', 'PUT'])
def update(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.watchlist_write(entity.watchlist_id))
    data = EntityForm().deserialize(request_data())
    watchlist = data.get('watchlist')
    authz.require(watchlist)
    authz.require(authz.watchlist_write(watchlist.id))
    entity.update(data)
    watchlist.touch()
    db.session.commit()
    analyze_entity.delay(entity.id)
    return view(entity.id)


@blueprint.route('/api/1/entities/<int:id>', methods=['DELETE'])
def delete(id):
    entity = obj_or_404(Entity.by_id(id))
    authz.require(authz.watchlist_write(entity.watchlist_id))
    entity.delete()
    db.session.commit()
    analyze_entity.delay(id)
    return jsonify({'status': 'ok'})
