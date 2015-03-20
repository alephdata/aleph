from flask import Blueprint, request
from apikit import jsonify, obj_or_404

from aleph import authz
from aleph.model import Source
from aleph.views.cache import etag_cache_keygen
from aleph.crawlers import get_crawlers
from aleph.crawlers.doccloud import DocumentCloudCrawler


blueprint = Blueprint('crawlers', __name__)


@blueprint.route('/api/1/crawlers')
def index():
    crawlers = []
    for name, cls in get_crawlers().items():
        crawlers.append({
            'name': name,
            'label': getattr(cls, 'LABEL') or name,
            'url': getattr(cls, 'SITE'),
        })
    etag_cache_keygen([c['name'] for c in crawlers])
    return jsonify({'results': crawlers, 'total': len(crawlers)})


@blueprint.route('/api/1/crawlers/dc_projects')
def dc_projects():
    slug = request.args.get('source')
    authz.require(authz.source_read(slug))
    source = obj_or_404(Source.by_slug(slug))
    if not isinstance(source.crawler_instance, DocumentCloudCrawler):
        return jsonify({'credentials': False})
    username = request.args.get('username')
    password = request.args.get('password')
    projects = source.crawler_instance.get_projects(username, password)
    if projects is False:
        return jsonify({'credentials': False})
    else:
        return jsonify({'credentials': True,
                        'projects': projects})
