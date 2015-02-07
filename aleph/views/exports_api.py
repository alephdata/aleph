import json
import StringIO

from flask import Blueprint, request
import xlsxwriter

blueprint = Blueprint('exports', __name__)

XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


@blueprint.route('/api/1/export')
def export():
    output = StringIO.StringIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet('Search results')

    keys = None
    row = 0
    header = workbook.add_format({'bold': True, 'border': 1, 'fg_color': '#D7E4BC'})
    for res in s[0:100000]:
        data = res._results_dict
        if keys is None:
            col = 0
            keys = [k for k in data.keys() if k not in HIDDEN]
            for key in keys:
                worksheet.write(row, col, key, header)
                col += 1
            row += 1

        col = 0
        for key in keys:
            val = data.get(key, None)
            if isinstance(val, (list, tuple, set, dict)):
                val = json.dumps(val)
            worksheet.write(row, col, val)
            col += 1
        row += 1

    worksheet.freeze_panes(1, 0)
    workbook.close()
    output.seek(0)
    res = make_response(output.read())
    res.headers["Content-Type"] = XLSX_MIME
    res.headers["Content-Disposition"] = "attachment; filename=export.xlsx"
    return res
