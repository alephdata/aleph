from flask import Blueprint, request
from apikit import request_data, jsonify, Pager
from sqlalchemy import or_

from aleph.model import db, CrawlerState
from aleph.crawlers import get_exposed_crawlers, execute_crawler

blueprint = Blueprint('crawlers_api', __name__)


@blueprint.route('/api/1/crawlers', methods=['GET'])
def index():
    request.authz.require(request.authz.is_admin)
    crawlers = list(get_exposed_crawlers())
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


@blueprint.route('/api/1/collections/<int:id>/crawlerstates',
                 methods=['GET'])
def collection_crawlerstates(id):
    request.authz.require(request.authz.collection_read(id))
    q = db.session.query(CrawlerState)
    q = q.filter(CrawlerState.collection_id == id)
    q = q.filter(or_(
        CrawlerState.error_type != 'init',
        CrawlerState.error_type == None  # noqa
    ))

    status = request.args.get('status')
    if status:
        q = q.filter(CrawlerState.status == status)

    crawler_id = request.args.get('crawler_id')
    if crawler_id:
        q = q.filter(CrawlerState.crawler_id == crawler_id)

    crawler_run = request.args.get('crawler_run')
    if crawler_run:
        q = q.filter(CrawlerState.crawler_run == crawler_run)

    q = q.order_by(CrawlerState.created_at.desc())
    return jsonify(Pager(q, id=id))
