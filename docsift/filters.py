import urllib
from datetime import datetime
from pprint import pformat
from jinja2 import Markup
from flask import url_for

from docsift.app import app, stash


@app.template_filter('field')
def reverse_filter(result, field):
    if field in result.es_meta.highlight:
        matches = result.es_meta.highlight[field]
        if len(matches):
            return Markup(matches[0])
    return Markup(result[field])


@app.template_filter('or')
def or_filter(result, repl):
    if len(unicode(result).strip()) < 3:
        return Markup("<span class='placeholder'>%s</span>" % repl)
    #return Markup(result[field])
    return result


@app.template_filter('decode')
def decode_filter(result):
    return urllib.unquote(result)


@app.template_filter('stringify')
def stringify_filter(result):
    if isinstance(result, datetime):
        return result.strftime('%B %d, %Y %H:%M')
    elif isinstance(result, dict):
        fmt = pformat(result).strip()
        return Markup('<pre>%s</pre>' % fmt)
    else:
        return unicode(result)[:300]


@app.template_filter('download_url')
def download_filter(result):
    collection = stash.get(result.es_meta.type)
    document = collection.get(result.es_meta.id)
    return url_for('download', collection=collection.name,
                   hash=result.es_meta.id, file=document.get('file'))


@app.template_filter('details_url')
def details_filter(result):
    collection = stash.get(result.es_meta.type)
    return url_for('details', collection=collection.name,
                   hash=result.es_meta.id)
