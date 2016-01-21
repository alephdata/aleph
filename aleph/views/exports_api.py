import json
import StringIO

from flask import Blueprint, request, send_file
import xlsxwriter

from aleph.model import Entity, Source
from aleph.search import raw_iter
from aleph.search import documents_query

blueprint = Blueprint('exports', __name__)

XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
SKIP_FIELDS = ['summary_latin', 'title_latin', 'content_hash']


def make_excel(results):
    output = StringIO.StringIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet('Documents')

    attributes = set()
    for result in results:
        attributes.update(result.keys())

    row = 0
    header = workbook.add_format({
        'bold': True,
        'border': 1,
        'fg_color': '#D7E4BC'
    })
    for data in results:
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


def format_results(query):
    sources = {}
    entities = {}
    results = []
    for row in raw_iter(query):
        src = row.get('_source')
        data = {}
        for name, value in src.items():
            if isinstance(value, dict) or name in SKIP_FIELDS:
                continue
            if name == 'entities':
                load_ids = []
                for entity_id in value:
                    if entity_id not in entities:
                        load_ids.append(entity_id)
                if len(load_ids):
                    for id, ent in Entity.by_id_set(load_ids).items():
                        entities[id] = ent.name

                value = ', '.join([entities.get(e) for e in value
                                   if entities.get(e) is not None])
            if isinstance(value, (list, tuple, set)):
                value = ', '.join(value)
            if name == 'source_id':
                # WARNING: don't to one query per row
                if value not in sources:
                    source = Source.by_id(value)
                    if source is None:
                        sources[value] = '[Deleted source %s]' % value
                    else:
                        sources[value] = source.label
                value = sources[value]
            data[name] = value
            results.append(data)
    return results


@blueprint.route('/api/1/query/export')
def export():
    output = format_results(documents_query(request.args))
    output = make_excel(output)
    return send_file(output, mimetype=XLSX_MIME, as_attachment=True,
                     attachment_filename='export.xlsx')
