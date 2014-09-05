from flask import render_template, request
from flask_pager import Pager

from docsift.filters import app
from docsift.search import make_query, es, es_index


@app.route("/")
def index():
    s = make_query()
    if 'collection' in request.args:
        s = s.doctypes(*request.args.getlist('collection'))
    if 'query' in request.args and len(request.args.get('query')):
        s = s.query(_all__query_string=request.args.get('query'))
        s = s.highlight('title', 'text', 'file')
    #print s, list(s) #, s.build_search()
    return render_template('index.html',
                           pager=Pager(s, limit=15),
                           query=request.args.get('query', ''))
