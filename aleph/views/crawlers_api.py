from flask import Blueprint
from apikit import request_data, jsonify

from aleph import authz
from aleph.crawlers import get_exposed_crawlers, execute_crawler

blueprint = Blueprint('crawlers_api', __name__)


@blueprint.route('/api/1/crawlers', methods=['GET'])
def index():
    authz.require(authz.is_admin())
    crawlers = list(get_exposed_crawlers())
    return jsonify({'results': crawlers, 'total': len(crawlers)})


@blueprint.route('/api/1/crawlers', methods=['POST', 'PUT'])
def queue():
    authz.require(authz.is_admin())
    data = request_data()
    crawler_id = data.get('crawler_id')
    for cls in get_exposed_crawlers():
        if crawler_id == cls.get_id():
            incremental = bool(data.get('incremental', False))
            execute_crawler.delay(crawler_id, incremental=incremental)
            return jsonify({'status': 'queued'})
    return jsonify({'status': 'error', 'message': 'No such crawler'},
                   status=400)
