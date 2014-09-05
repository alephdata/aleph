import urllib
from jinja2 import Markup

from docsift.app import app


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
