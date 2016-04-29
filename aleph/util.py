import os
import re
import gc
import six
import logging
import unicodedata
from hashlib import sha1
from datetime import datetime, date
from unidecode import unidecode
from normality import slugify

log = logging.getLogger(__name__)
COLLAPSE = re.compile(r'\s+')
WS = ' '

# Unicode character classes, see:
# http://www.fileformat.info/info/unicode/category/index.htm
CATEGORIES = {
    'C': '',
    'M': ' . ',
    'Z': WS,
    'P': '',
    'S': WS
}


def checksum(filename):
    """Generate a hash for a given file name."""
    hash = sha1()
    with open(filename, 'rb') as fh:
        while True:
            block = fh.read(2 ** 10)
            if not block:
                break
            hash.update(block)
    return hash.hexdigest()


def make_filename(source, sep='-'):
    if source is not None:
        source = os.path.basename(source)
        slugs = [slugify(s, sep=sep) for s in source.split('.')]
        source = '.'.join(slugs)
        source = source.strip('.').strip(sep)
    return source


def latinize_text(text):
    if not isinstance(text, six.text_type):
        return text
    text = unicode(unidecode(text))
    text = text.replace('@', 'a')
    return text.lower()


def normalize_strong(text):
    if not isinstance(text, six.string_types):
        return

    if six.PY2 and not isinstance(text, six.text_type):
        text = text.decode('utf-8')

    text = latinize_text(text.lower())
    text = unicodedata.normalize('NFKD', text)
    characters = []
    for character in text:
        category = unicodedata.category(character)[0]
        character = CATEGORIES.get(category, character)
        characters.append(character)
    text = u''.join(characters)
    return COLLAPSE.sub(WS, text).strip(WS)


def string_value(value, encoding=None):
    if encoding is None:
        encoding = 'utf-8'
    try:
        if value is None:
            return
        if isinstance(value, (date, datetime)):
            return value.isoformat()
        elif isinstance(value, float) and not value.is_integer():
            return unicode(value)
        elif isinstance(value, six.string_types):
            if not isinstance(value, six.text_type):
                value = value.decode(encoding)
            if not len(value.strip()):
                return
        else:
            value = unicode(value)
        return value
    except Exception as ex:
        log.exception(ex)
        return


def find_subclasses(cls):
    # https://stackoverflow.com/questions/8956928
    all_refs = gc.get_referrers(cls)
    results = []
    for o in all_refs:
        if (isinstance(o, tuple) and getattr(o[0], "__mro__", None) is o):
            results.append(o[0])
    return results
