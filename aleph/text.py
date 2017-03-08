# coding: utf-8
import six
import logging
from normality import normalize, stringify
from normality import slugify  # noqa

log = logging.getLogger(__name__)


def normalize_strong(text):
    """Perform heavy normalisation of a given text.

    The goal of this function is not to retain a readable version of the given
    string, but rather to yield a normalised version suitable for comparisons
    and machine analysis.
    """
    return normalize(text, lowercase=True, ascii=True)


def string_value(value, encoding_default='utf-8', encoding=None):
    return stringify(value,
                     encoding_default=encoding_default,
                     encoding=encoding)


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
