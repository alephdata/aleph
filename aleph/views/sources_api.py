from flask import Blueprint
from flask.ext.login import current_user
from apikit import obj_or_404, request_data, jsonify

from aleph.views.cache import etag_cache_keygen
from aleph.processing import process_collection
from aleph.crawlers import crawl_source
from aleph.model import Source
from aleph.core import db
from aleph import authz


blueprint = Blueprint('sources', __name__)


@blueprint.route('/api/1/sources', methods=['GET'])
def index():
    sources = []
    latest = set()
    for source in Source.all_by_user(current_user):
        data = source.to_dict()
        data['can_write'] = authz.source_write(source.slug)
        latest.add(data['updated_at'])
        sources.append(data)
    if len(latest):
        etag_cache_keygen(max(latest))
    return jsonify({'results': sources, 'total': len(sources)})


@blueprint.route('/api/1/sources', methods=['POST', 'PUT'])
def create():
    authz.require(authz.logged_in())
    src = Source.create(request_data(), current_user)
    db.session.commit()
    return view(src.slug)


@blueprint.route('/api/1/sources/<slug>', methods=['GET'])
def view(slug):
    authz.require(authz.source_read(slug))
    source = obj_or_404(Source.by_slug(slug))
    etag_cache_keygen(source)
    data = source.to_dict()
    data['can_write'] = authz.source_write(slug)
    if data['can_write']:
        data['users'] = [u.id for u in source.users]
        data['config'] = source.config
    return jsonify(data)


@blueprint.route('/api/1/sources/<slug>/crawl', methods=['POST', 'PUT'])
def crawl(slug):
    authz.require(authz.source_write(slug))
    source = obj_or_404(Source.by_slug(slug))
    crawl_source.delay(source.slug)
    return jsonify({'status': 'ok'})


@blueprint.route('/api/1/sources/<slug>/process', methods=['POST', 'PUT'])
def process(slug):
    authz.require(authz.source_write(slug))
    source = obj_or_404(Source.by_slug(slug))
    process_collection.delay(source.slug)
    return jsonify({'status': 'ok'})


@blueprint.route('/api/1/sources/<slug>', methods=['POST', 'PUT'])
def update(slug):
    authz.require(authz.source_write(slug))
    source = obj_or_404(Source.by_slug(slug))
    source.update(request_data(), current_user)
    db.session.add(source)
    db.session.commit()
    return view(slug)
