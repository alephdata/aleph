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
FACETS = app.config.get('FACETS', {})
FILTER = 'filter-'


def get_filter_query():
    if 'filter_query' in request.args:
        return request.args.get('filter_query')
    return app.config.get('DEFAULT_FILTER', '')


def query():
    s = make_query()
    if 'collection' in request.args:
        s = s.doctypes(*request.args.getlist('collection'))
    if 'query' in request.args and len(request.args.get('query')):
        s = s.query(_all__query_string=request.args.get('query'))
        s = s.highlight('title', 'text', 'file')

    for k, v in request.args.items():
        if k.startswith(FILTER):
            k = k.split(FILTER).pop()
            s = s.filter(**{k: v})
    #if len(get_filter_query()):
    #    s = s.filter(_all=get_filter_query())
    return s


@app.route("/")
def index():
    s = query()
    s = s.facet(*FACETS.keys(), size=10)

    facets = [(f, FILTER + f, t) for (f, t) in FACETS.items()]

    return render_template('index.html',
                           pager=Pager(s, limit=15),
                           query=request.args.get('query', ''),
                           filter_query=get_filter_query(),
                           facets=facets,
                           facet_counts=s.facet_counts())


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
