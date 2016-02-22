from werkzeug.exceptions import NotFound
from flask import Blueprint, request
from apikit import jsonify, get_limit, get_offset

from aleph.search.tabular import tabular_query, execute_tabular_query
from aleph.views.document_api import get_document
from aleph.views.cache import enable_cache


blueprint = Blueprint('table', __name__)


def get_tabular(document_id, table_id):
    document = get_document(document_id)
    try:
        table = document.tables[table_id]
    except IndexError:
        raise NotFound("No such table: %s" % table_id)
    return document, table


@blueprint.route('/api/1/documents/<int:document_id>/tables/<int:table_id>')
def view(document_id, table_id):
    document, tabular = get_tabular(document_id, table_id)
    enable_cache(vary_user=True)
    return jsonify(tabular)


@blueprint.route('/api/1/documents/<int:document_id>/tables/<int:table_id>/rows')
def rows(document_id, table_id):
    document, tabular = get_tabular(document_id, table_id)
    enable_cache(vary_user=True)
    query = tabular_query(document_id, table_id, request.args)
    query['size'] = get_limit(default=100)
    query['from'] = get_offset()
    return jsonify(execute_tabular_query(document_id, table_id,
                                         request.args, query))
