# coding: utf-8
import six
import logging
from decimal import Decimal
from normality import guess_encoding, collapse_spaces, category_replace
from normality import ascii_text as latinize_text
from normality import slugify  # noqa
from unicodedata import category
from datetime import datetime, date

log = logging.getLogger(__name__)


def normalize_strong(text):
    """Perform heavy normalisation of a given text.

    The goal of this function is not to retain a readable version of the given
    string, but rather to yield a normalised version suitable for comparisons
    and machine analysis.
    """
    text = latinize_text(string_value(text))
    if text is None:
        return
    text = category_replace(text.lower())
    return collapse_spaces(text)


def string_value(value, encoding_default='utf-8', encoding=None):
    """Brute-force convert a given object to a string.

    This will attempt an increasingly mean set of conversions to make a given
    object into a unicode string. It is guaranteed to either return unicode or
    None, if all conversions failed (or the value is indeed empty).
    """
    if value is None:
        return None

    if not isinstance(value, six.text_type):
        if isinstance(value, (date, datetime)):
            return value.isoformat()

        if isinstance(value, (float, Decimal)):
            return Decimal(value).to_eng_string()

        if isinstance(value, six.string_types):
            if encoding is None:
                encoding = guess_encoding(encoding_default)
            value = value.decode(encoding, 'replace')
            value = ''.join(ch for ch in value if category(ch)[0] != 'C')
            value = value.replace(u'\xfe\xff', '')  # remove BOM

        else:
            value = six.text_type(value)

    value = value.strip()
    if not len(value):
        return None
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
