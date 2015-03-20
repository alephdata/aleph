from flask import Blueprint, redirect
from apikit import jsonify

from aleph import authz
from aleph.crawlers import get_crawlers


blueprint = Blueprint('crawlers', __name__)


@blueprint.route('/api/1/crawlers')
def index():
    crawlers = []
    for name, cls in get_crawlers().items():
        crawlers.append({
            'name': name,
            'label': getattr(cls, 'DEFAULT_LABEL') or name,
            'url': getattr(cls, 'DEFAULT_SITE'),
        })
    return jsonify({'results': crawlers, 'total': len(crawlers)})
