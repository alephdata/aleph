from flask import Blueprint
from flask.ext.login import current_user
from apikit import obj_or_404, jsonify, Pager, request_data

from aleph import authz
from aleph.model import List, db
from aleph.analyze import analyze_terms
from aleph.views.cache import etag_cache_keygen

blueprint = Blueprint('lists', __name__)


@blueprint.route('/api/1/lists', methods=['GET'])
def index():
    q = List.all(list_ids=authz.lists(authz.READ))
    return jsonify(Pager(q).to_dict())


@blueprint.route('/api/1/lists', methods=['POST', 'PUT'])
def create():
    authz.require(authz.logged_in())
    data = request_data()
    data['creator'] = current_user
    if 'users' not in data:
        data['users'] = []
    lst = List.create(data, current_user)
    db.session.commit()
    return view(lst.id)


@blueprint.route('/api/1/lists/<int:id>', methods=['GET'])
def view(id):
    authz.require(authz.list_read(id))
    lst = obj_or_404(List.by_id(id))
    etag_cache_keygen(lst)
    data = lst.to_dict()
    data['users'] = [u.id for u in lst.users]
    return jsonify(data)


@blueprint.route('/api/1/lists/<int:id>', methods=['POST', 'PUT'])
def update(id):
    authz.require(authz.list_write(id))
    lst = obj_or_404(List.by_id(id))
    lst.update(request_data(), current_user)
    db.session.add(lst)
    db.session.commit()
    return view(id)


@blueprint.route('/api/1/lists/<int:id>', methods=['DELETE'])
def delete(id):
    authz.require(authz.list_write(id))
    lst = obj_or_404(List.by_id(id))
    terms = lst.terms
    lst.delete()
    db.session.commit()
    analyze_terms.delay(list(terms))
    return jsonify({'status': 'ok'})
