from flask import Blueprint
from apikit import jsonify

from aleph.views.cache import etag_cache_keygen
from aleph.crawlers import get_crawlers


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
