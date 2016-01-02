from flask import Blueprint
from flask.ext.login import current_user
from apikit import obj_or_404, request_data, jsonify

from aleph.views.cache import etag_cache_keygen
from aleph.analyze import analyze_source
from aleph.model import Source
from aleph.core import db
from aleph import authz


blueprint = Blueprint('sources', __name__)


@blueprint.route('/api/1/sources', methods=['GET'])
def index():
    sources = []
    for source in Source.all(ids=authz.sources(authz.READ)):
        data = source.to_dict()
        data['can_write'] = authz.source_write(source.id)
        sources.append(data)
    return jsonify({'results': sources, 'total': len(sources)})


@blueprint.route('/api/1/sources', methods=['POST', 'PUT'])
def create():
    authz.require(authz.logged_in())
    src = Source.create(request_data(), current_user)
    db.session.commit()
    return view(src.id)


@blueprint.route('/api/1/sources/<id>', methods=['GET'])
def view(id):
    authz.require(authz.source_read(id))
    source = obj_or_404(Source.by_id(id))
    etag_cache_keygen(source)
    data = source.to_dict()
    data['users'] = [u.id for u in source.users]
    return jsonify(data)


@blueprint.route('/api/1/sources/<id>/process', methods=['POST', 'PUT'])
def process(id):
    authz.require(authz.source_write(id))
    source = obj_or_404(Source.by_id(id))
    analyze_source.delay(source.id)
    return jsonify({'status': 'ok'})


@blueprint.route('/api/1/sources/<id>', methods=['POST', 'PUT'])
def update(id):
    authz.require(authz.source_write(id))
    source = obj_or_404(Source.by_id(id))
    source.update(request_data(), current_user)
    db.session.add(source)
    db.session.commit()
    return view(id)
