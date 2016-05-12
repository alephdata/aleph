import os
import logging
from hashlib import sha1
try:
    import cPickle as pickle
except ImportError:
    import pickle

# consider https://dogpilecache.readthedocs.org/en/latest
# also: locking :)
log = logging.getLogger(__name__)
CACHE_DIR = os.environ.get('EXTRACTORS_CACHE_DIR')


def key_path(key):
    path = os.path.join(key[:2], key[2:4], key[4:6], key)
    return os.path.join(CACHE_DIR, path)


def get_cache(data):
    if CACHE_DIR is None:
        log.debug('No EXTRACTORS_CACHE_DIR is set, not caching.')
        return None, None
    key = sha1(data).hexdigest()
    try:
        with open(key_path(key), 'rb') as fh:
            return key, pickle.load(fh)
    except IOError:
        return key, None


def set_cache(key, value):
    if CACHE_DIR is None or key is None or value is None:
        return
    path = key_path(key)
    try:
        os.makedirs(os.path.dirname(path))
    except:
        pass
    with open(path, 'wb') as fh:
        pickle.dump(value, fh)
