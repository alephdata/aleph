from flask import Blueprint
from apikit import obj_or_404, request_data, Pager, jsonify

from aleph import authz
from aleph.core import db
from aleph.model import Source
from aleph.analyze import analyze_source


blueprint = Blueprint('sources_api', __name__)


@blueprint.route('/api/1/sources', methods=['GET'])
def index():
    q = Source.all_by_ids(ids=authz.sources(authz.READ))
    return jsonify(Pager(q))


@blueprint.route('/api/1/sources/<int:id>', methods=['GET'])
def view(id):
    authz.require(authz.source_read(id))
    source = obj_or_404(Source.by_id(id))
    return jsonify(source)


@blueprint.route('/api/1/sources/<int:id>/process', methods=['POST', 'PUT'])
def process(id):
    authz.require(authz.source_write(id))
    source = obj_or_404(Source.by_id(id))
    analyze_source.delay(source.id)
    return jsonify({'status': 'ok'})


@blueprint.route('/api/1/sources/<int:id>', methods=['POST', 'PUT'])
def update(id):
    authz.require(authz.source_write(id))
    source = obj_or_404(Source.by_id(id))
    source.update(request_data())
    db.session.add(source)
    db.session.commit()
    return view(id)
