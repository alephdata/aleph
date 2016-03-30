from flask import Blueprint, request, send_file

from aleph.core import url_for
from aleph.model import Source
from aleph.search import scan_iter, documents_query
from aleph.views.util import make_excel

blueprint = Blueprint('exports_api', __name__)


XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
FIELDS = ['source', 'title', 'file_name', 'summary', 'extension',
          'mime_type', 'languages', 'countries', 'keywords', 'dates',
          'file_url', 'source_url']


def get_results(query):
    sources = {}
    for row in scan_iter(query):
        data = {
            'file_url': url_for('documents_api.file',
                                document_id=row.get('_id'))
        }
        for name, value in row.get('_source').items():
            if name == 'source_id':
                if value not in sources:
                    source = Source.by_id(value)
                    if source is None:
                        sources[value] = '[Deleted source %s]' % value
                    else:
                        sources[value] = source.label
                value = sources[value]
                name = 'source'
            if name not in FIELDS:
                continue
            if isinstance(value, (list, tuple, set)):
                value = ', '.join(value)
            data[name] = value
        yield data


@blueprint.route('/api/1/query/export')
def export():
    query = documents_query(request.args)
    query = {'query': query['query']}
    output = make_excel(get_results(query), FIELDS)
    return send_file(output, mimetype=XLSX_MIME, as_attachment=True,
                     attachment_filename='export.xlsx')
