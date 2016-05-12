# coding: utf-8
import os
import gc
import logging
from hashlib import sha1
from normality import slugify

log = logging.getLogger(__name__)


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


def find_subclasses(cls):
    # https://stackoverflow.com/questions/8956928
    all_refs = gc.get_referrers(cls)
    results = []
    for o in all_refs:
        if (isinstance(o, tuple) and getattr(o[0], "__mro__", None) is o):
            results.append(o[0])
    return results
