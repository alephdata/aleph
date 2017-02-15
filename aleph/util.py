# coding: utf-8
import os
import gc
import six
import json
import shutil
import logging
from os import path
from hashlib import sha1
from tempfile import mkdtemp
from apikit.jsonify import JSONEncoder

from aleph.text import string_value, slugify

log = logging.getLogger(__name__)
TMP_PREFIX = six.text_type('aleph.tmp.')


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


def make_filename(file_name, sep='-'):
    if file_name is not None:
        file_name = os.path.basename(six.text_type(file_name))
        slugs = [slugify(s, sep=sep) for s in file_name.rsplit('.', 1)]
        slugs = [s[:200] for s in slugs if s is not None]
        file_name = '.'.join(slugs)
        file_name = file_name.strip('.').strip(sep)
        file_name = six.text_type(file_name)
        if not len(file_name.strip()):
            file_name = None
    return file_name


def make_tempdir(name=None):
    name = string_value(name) or 'data'
    dirpath = path.join(mkdtemp(prefix=TMP_PREFIX), name)
    os.makedirs(dirpath)
    return dirpath


def remove_tempdir(dirpath):
    if dirpath is None:
        return
    parent = path.normpath(path.join(dirpath, '..'))
    name = path.dirname(parent)
    if path.exists(parent) and name is not None \
            and name.startswith(TMP_PREFIX):
        shutil.rmtree(parent)
    elif path.isdir(dirpath):
        shutil.rmtree(dirpath)


def make_tempfile(name=None, suffix=None):
    name = string_value(name) or 'data'
    suffix = string_value(suffix)
    if suffix is not None:
        name = '%s.%s' % (name, suffix.strip('.'))
    return os.path.join(make_tempdir(), name)


def remove_tempfile(filepath):
    if filepath is None:
        return
    remove_tempdir(path.dirname(filepath))


def find_subclasses(cls):
    # https://stackoverflow.com/questions/8956928
    all_refs = gc.get_referrers(cls)
    results = []
    for o in all_refs:
        if (isinstance(o, tuple) and getattr(o[0], "__mro__", None) is o):
            results.append(o[0])
    return results


def expand_json(data):
    """Make complex objects (w/ dates, to_dict) into JSON."""
    data = JSONEncoder().encode(data)
    return json.loads(data)
