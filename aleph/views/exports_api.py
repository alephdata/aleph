from flask import Blueprint, request, send_file

from aleph import authz
from aleph.core import url_for
from aleph.model import Collection
from aleph.events import log_event
from aleph.search import QueryState, scan_iter, documents_query
from aleph.views.util import make_excel

blueprint = Blueprint('exports_api', __name__)


XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
FIELDS = ['collections', 'title', 'file_name', 'summary', 'extension',
          'mime_type', 'languages', 'countries', 'keywords', 'dates',
          'file_url', 'source_url']


def get_results(query, limit):
    collections = {}
    for i, row in enumerate(scan_iter(query)):
        if i >= limit:
            return
        data = {
            'file_url': url_for('documents_api.file',
                                document_id=row.get('_id'))
        }
        for name, value in row.get('_source').items():
            if name == 'collection_id':
                colls = []
                for coll in value:
                    if coll not in collections:
                        source = Collection.by_id(coll)
                        if source is None:
                            collections[coll] = '[Deleted collection %s]' % value
                        else:
                            collections[coll] = source.label
                    colls.append(collections[coll])
                value = ', '.join(sorted(colls))
                name = 'collections'
            if name not in FIELDS:
                continue
            if isinstance(value, (list, tuple, set)):
                value = ', '.join(value)
            data[name] = value
        yield data


@blueprint.route('/api/1/query/export')
def export():
    authz_collections = authz.collections(authz.READ)
    state = QueryState(request.args, authz_collections, limit=0)
    query = documents_query(state)
    query = {
        'query': query['query']
    }
    log_event(request)
    output = make_excel(get_results(query, 50000), FIELDS)
    return send_file(output, mimetype=XLSX_MIME, as_attachment=True,
                     attachment_filename='export.xlsx')
