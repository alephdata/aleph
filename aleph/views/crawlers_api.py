from flask import Blueprint, request
from apikit import request_data, jsonify, Pager

from aleph.crawlers import get_exposed_crawlers, execute_crawler

blueprint = Blueprint('crawlers_api', __name__)


@blueprint.route('/api/1/crawlers', methods=['GET'])
def index():
    request.authz.require(request.authz.is_admin)
    crawlers = list(sorted(get_exposed_crawlers(),
                           key=lambda c: c.CRAWLER_NAME))
    return jsonify(Pager(crawlers, limit=20))


@blueprint.route('/api/1/crawlers', methods=['POST', 'PUT'])
def queue():
    request.authz.require(request.authz.session_write())
    request.authz.require(request.authz.is_admin)
    data = request_data()
    crawler_id = data.get('crawler_id')
    for cls in get_exposed_crawlers():
        if crawler_id == cls.get_id():
            incremental = bool(data.get('incremental', False))
            execute_crawler.delay(crawler_id, incremental=incremental)
            return jsonify({'status': 'queued'})
    return jsonify({'status': 'error', 'message': 'No such crawler'},
                   status=400)
