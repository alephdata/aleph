# coding: utf-8
import os
import six
import yaml
import shutil
from os import path
from hashlib import sha1
from celery import Task
from tempfile import mkdtemp

from aleph.text import string_value

TMP_PREFIX = six.text_type('aleph.tmp.')
PDF_MIME = 'application/pdf'


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


def load_config_file(file_path):
    """Load a YAML (or JSON) graph model configuration file."""
    file_path = os.path.abspath(file_path)
    with open(file_path, 'r') as fh:
        data = yaml.load(fh) or {}
    return resolve_includes(file_path, data)


def resolve_includes(file_path, data):
    """Handle include statements in the graph configuration file.

    This allows the YAML graph configuration to be broken into
    multiple smaller fragments that are easier to maintain."""
    if isinstance(data, (list, tuple, set)):
        data = [resolve_includes(file_path, i) for i in data]
    elif isinstance(data, dict):
        include_paths = data.pop('include', [])
        if not isinstance(include_paths, (list, tuple, set)):
            include_paths = [include_paths]
        for include_path in include_paths:
            dir_prefix = os.path.dirname(file_path)
            include_path = os.path.join(dir_prefix, include_path)
            data.update(load_config_file(include_path))
        for key, value in data.items():
            data[key] = resolve_includes(file_path, value)
    return data


def is_list(obj):
    return isinstance(obj, (list, tuple, set))


def unique_list(lst):
    """Make a list unique, retaining order of initial appearance."""
    uniq = []
    for item in lst:
        if item not in uniq:
            uniq.append(item)
    return uniq


def ensure_list(obj):
    """Make the returned object a list, otherwise wrap as single item."""
    if obj is None:
        return []
    if not is_list(obj):
        return [obj]
    return obj


def dict_list(data, *keys):
    """Get an entry as a list from a dict. Provide a fallback key."""
    for key in keys:
        if key in data:
            return ensure_list(data[key])
    return []


class SessionTask(Task):

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        from aleph.core import db
        db.session.remove()
