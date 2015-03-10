from flask import Blueprint
from flask.ext.login import current_user

from aleph.views.util import obj_or_404, request_data, jsonify
from aleph.views.cache import etag_cache_keygen
from aleph.model import Collection
from aleph.core import db
from aleph import authz


blueprint = Blueprint('collections', __name__)


@blueprint.route('/api/1/collections', methods=['GET'])
def index():
    collections = []
    latest = set()
    for coll in Collection.all_by_user(current_user):
        data = coll.to_dict()
        data['can_write'] = authz.collection_write(coll.slug)
        if data['can_write']:
            data['token'] = coll.token
        latest.add(data['updated_at'])
        collections.append(data)
    etag_cache_keygen(max(latest))
    return jsonify({'results': collections, 'total': len(collections)})


@blueprint.route('/api/1/collections/<slug>', methods=['GET'])
def view(slug):
    authz.require(authz.collection_read(slug))
    collection = obj_or_404(Collection.by_slug(slug))
    etag_cache_keygen(collection)
    data = collection.to_dict()
    data['can_write'] = authz.collection_write(slug)
    if data['can_write']:
        data['token'] = collection.token
        data['users'] = [u.id for u in collection.users]
    return jsonify(data)


@blueprint.route('/api/1/collections/<slug>', methods=['POST', 'PUT'])
def update(slug):
    authz.require(authz.collection_write(slug))
    collection = obj_or_404(Collection.by_slug(slug))
    collection.update(request_data(), current_user)
    db.session.add(collection)
    db.session.commit()
    return view(slug)
