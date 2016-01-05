from werkzeug.exceptions import NotFound
from flask import Blueprint, request
from apikit import jsonify, Pager

from aleph.model.tabular_query import TabularQuery
from aleph.views.document_api import get_document


blueprint = Blueprint('table', __name__)


def get_tabular(document_id, table_id):
    document = get_document(document_id)
    try:
        table = document.tables[table_id]
    except IndexError:
        raise NotFound("No such table: %s" % table_id)
    return document, table


@blueprint.route('/api/1/documents/<document_id>/tables/<int:table_id>')
def view(document_id, table_id):
    document, tabular = get_tabular(document_id, table_id)
    return jsonify(tabular)


@blueprint.route('/api/1/documents/<document_id>/tables/<int:table_id>/rows')
def rows(document_id, table_id):
    document, tabular = get_tabular(document_id, table_id)
    query = TabularQuery(tabular, {})
    return jsonify(Pager(query, document_id=document_id,
                         table_id=table_id))
