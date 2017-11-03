# coding: utf-8
import logging
from urllib import urlencode
from normality import normalize, stringify
from normality import slugify  # noqa

log = logging.getLogger(__name__)


def match_form(text):
    """Turn a string into a form appropriate for name matching.

    The goal of this function is not to retain a readable version of the given
    string, but rather to yield a normalised version suitable for comparisons
    and machine analysis.
    """
    return normalize(text, lowercase=True, ascii=True)


def query_string(items):
    """Given a list of tuples, returns a query string for URL building."""
    query = []
    for (field, value) in items:
        value = stringify(value)
        if value is None:
            continue
        value = value.encode('utf-8')
        query.append((field, value))
    if not len(query):
        return ''
    return '?' + urlencode(query)
