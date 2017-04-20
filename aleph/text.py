# coding: utf-8
import six
import logging
from normality import normalize, stringify, latinize_text, collapse_spaces
from normality import slugify  # noqa
from normality.cleaning import decompose_nfkd, remove_control_chars

log = logging.getLogger(__name__)
INDEX_MAX_LEN = 1024 * 1024 * 100


def index_form(texts):
    """Turn a set of strings into the appropriate form for indexing."""
    results = []
    total_len = 0

    for text in texts:
        # We don't want to store more than INDEX_MAX_LEN of text per doc
        if total_len > INDEX_MAX_LEN:
            # TODO: there might be nicer techniques for dealing with overly
            # long text buffers?
            results = list(set(results))
            total_len = sum((len(t) for t in results))
            if total_len > INDEX_MAX_LEN:
                break

        text = stringify(text)
        if text is None:
            continue
        text = collapse_spaces(text)
        # XXX: is NFKD a great idea?
        text = decompose_nfkd(text)
        total_len += len(text)
        results.append(text)

        # Make latinized text version
        latin = latinize_text(text)
        latin = stringify(latin)
        if latin is None or latin == text:
            continue
        total_len += len(latin)
        results.append(latin)
    return results


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


def encoded_value(text):
    if isinstance(text, six.binary_type):
        return text
    return six.text_type(text).encode('utf-8')


def has_value(value):
    """Check a given value is not empty."""
    if value is None:
        return False
    if isinstance(value, six.string_types):
        if not len(value.strip()):
            return False
    return True
