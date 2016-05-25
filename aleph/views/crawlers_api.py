from flask import Blueprint, request
from apikit import request_data, jsonify, Pager

from aleph import authz
from aleph.model import db, CrawlerState
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


@blueprint.route('/api/1/crawlerstates', methods=['GET'])
def states():
    authz.require(authz.is_admin())
    q = db.session.query(CrawlerState)
    q = q.filter(CrawlerState.status == CrawlerState.STATUS_FAIL)
    if 'crawler_id' in request.args:
        q = q.filter(CrawlerState.crawler_id == request.args.get('crawler_id'))
    if 'crawler_run' in request.args:
        q = q.filter(CrawlerState.crawler_run == request.args.get('crawler_run'))
    if 'error_type' in request.args:
        q = q.filter(CrawlerState.error_type == request.args.get('error_type'))
    q = q.order_by(CrawlerState.created_at.desc())
    response = Pager(q).to_dict()
    return jsonify(response)
