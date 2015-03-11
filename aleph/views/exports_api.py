import json
import StringIO

from flask import Blueprint, request, send_file
import xlsxwriter

from aleph import authz
from aleph.model import Entity, Source
from aleph.search import raw_iter
from aleph.search.queries import document_query
from aleph.search.attributes import CORE_FIELDS

blueprint = Blueprint('exports', __name__)

XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


def make_excel(iter, attributes):
    output = StringIO.StringIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet('Documents')

    row = 0
    header = workbook.add_format({
        'bold': True,
        'border': 1,
        'fg_color': '#D7E4BC'
    })
    for data in iter:
        # data = res._results_dict
        if row == 0:
            col = 0
            for attr in attributes:
                worksheet.write(row, col, attr, header)
                col += 1
            row += 1

        col = 0
        for attr in attributes:
            val = data.get(attr, None)
            if isinstance(val, (list, tuple, set, dict)):
                val = json.dumps(val)
            worksheet.write(row, col, val)
            col += 1
        row += 1

    worksheet.freeze_panes(1, 0)
    workbook.close()
    output.seek(0)
    return output


def process_row(row, attributes):
    src = row.get('_source')
    data = {}
    for name in attributes:
        value = src.get(name)
        for attr in src.get('attributes', []):
            if attr.get('name') == name:
                value = attr.get('value')
        if name == 'entities':
            objs = Entity.by_id_set([e.get('id') for e in value])
            value = ', '.join([o.label for o in objs.values()])
        if name == 'collection':
            # WARNING: don't to one query per row
            value = unicode(Source.by_slug(value) or value)
        data[name] = value
    return data


@blueprint.route('/api/1/query/export')
def export():
    attributes = request.args.getlist('attribute')
    query = document_query(request.args, lists=authz.authz_lists('read'),
                           sources=authz.authz_sources('read'))
    query['_source'] = set(query['_source'])
    for attribute in attributes:
        if attribute in CORE_FIELDS:
            query['_source'].add(attribute)
        else:
            query['_source'].add('attributes')
    query['_source'] = list(query['_source'])
    output = (process_row(r, attributes) for r in raw_iter(query))
    output = make_excel(output, attributes)
    return send_file(output, mimetype=XLSX_MIME, as_attachment=True,
                     attachment_filename='export.xlsx')
