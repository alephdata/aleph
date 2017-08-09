# coding: utf-8
import six
import logging
from urllib import urlencode
from normality import normalize, stringify
from normality import slugify  # noqa
from normality.cleaning import remove_control_chars

log = logging.getLogger(__name__)


def match_form(text):
    """Turn a string into a form appropriate for name matching.

    The goal of this function is not to retain a readable version of the given
    string, but rather to yield a normalised version suitable for comparisons
    and machine analysis.
    """
    return normalize(text, lowercase=True, ascii=True)


def string_value(value, encoding=None):
    value = stringify(value, encoding=encoding, encoding_default='utf-8')
    value = remove_control_chars(value)
    return value


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


def has_value(value):
    """Check a given value is not empty."""
    if value is None:
        return False
    if isinstance(value, six.string_types):
        if not len(value.strip()):
            return False
    return True
