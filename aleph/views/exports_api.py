from flask import Blueprint, request, send_file

from aleph.core import url_for
from aleph.model import Collection
from aleph.events import log_event
from aleph.search import DocumentsQuery, SearchQueryParser
from aleph.views.util import make_excel

blueprint = Blueprint('exports_api', __name__)


XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
FIELDS = ['collection', 'title', 'file_name', 'summary', 'extension',
          'mime_type', 'languages', 'countries', 'keywords', 'dates',
          'file_url', 'source_url']


def get_results(query, limit):
    collections = {}
    for i, row in enumerate(query.scan()):
        if i >= limit:
            return
        source = row.get('_source')
        collection_id = source.pop('collection_id')
        if collection_id not in collections:
            obj = Collection.by_id(collection_id)
            if obj is None:
                collections[collection_id] = obj.label

        data = {
            'collection': collections.get(collection_id, '[Missing]'),
            'file_url': url_for('documents_api.file',
                                document_id=row.get('_id'))
        }
        for name, value in source.items():
            if name not in FIELDS:
                continue
            if isinstance(value, (list, tuple, set)):
                value = ', '.join(value)
            data[name] = value
        yield data


@blueprint.route('/api/2/query/export')
def export():
    parser = SearchQueryParser(request.args, request.authz)
    query = DocumentsQuery(parser)
    log_event(request)
    output = make_excel(get_results(query, 50000), FIELDS)
    return send_file(output, mimetype=XLSX_MIME, as_attachment=True,
                     attachment_filename='export.xlsx')
