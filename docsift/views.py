import StringIO
import json

import xlsxwriter
from flask import render_template, request
from flask import send_file, make_response
from flask_pager import Pager

from docsift.app import stash
from docsift.filters import app
from docsift.search import make_query, es, es_index


HIDDEN = app.config.get('HIDE_FIELDS', [])


@app.route("/collections/<collection>/document/<hash>/<path:file>")
def download(collection, hash, file):
    document = stash.get(collection).get(hash)
    return send_file(document.file)


@app.route("/collections/<collection>/document/<hash>")
def details(collection, hash):
    document = stash.get(collection).get(hash)

    meta = {}
    for key, value in document.items():
        if key in HIDDEN:
            continue
        if isinstance(value, (dict, list, tuple)) and not len(value):
            continue
        elif not len(unicode(value).strip()):
            continue
        meta[key] = value
    meta = sorted(meta.items())

    if 'snippet' in request.args:
        return render_template('_details.html', document=document, meta=meta)
    return render_template('document.html', document=document, meta=meta)


def query():
    s = make_query()
    if 'collection' in request.args:
        s = s.doctypes(*request.args.getlist('collection'))
    if 'query' in request.args and len(request.args.get('query')):
        s = s.query(_all__query_string=request.args.get('query'))
        s = s.highlight('title', 'text', 'file')
    return s


@app.route("/")
def index():
    s = query()
    #print s, list(s) #, s.build_search()
    return render_template('index.html',
                           pager=Pager(s, limit=15),
                           query=request.args.get('query', ''))


@app.route("/export")
def export():
    s = query()
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
    res.headers["Content-Type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    res.headers["Content-Disposition"] = "attachment; filename=export.xlsx"
    return res
