import urllib
from datetime import datetime
from pprint import pformat
from jinja2 import Markup
from flask import url_for, request

from docsift.app import app, stash


def get_mapping(name):
    return app.config.get('FIELD_MAPPING', {}).get(name, name)


def get_mapped(result, name):
    return result[get_mapping(name)]


def query_state():
    tuples = []
    for k, v in request.args.items():
        if k in ['limit', 'offset']:
            continue
        v = v.encode('utf-8')
        tuples.append((k, v))
    return '?' + urllib.urlencode(tuples)


@app.context_processor
def inject():
    return {
        'mapped': get_mapped,
        'query_state': query_state
    }


@app.template_filter('field')
def reverse_filter(result, field):
    field = get_mapping(field)
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
    normstr = unicode(result).lower()
    if isinstance(result, datetime):
        return result.strftime('%B %d, %Y %H:%M')
    elif isinstance(result, dict):
        fmt = pformat(result).strip()
        return Markup('<pre>%s</pre>' % fmt)
    elif normstr.startswith('http://') or normstr.startswith('https://'):
        return Markup('<a href="%s">%s</a>' % (result, result))
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
