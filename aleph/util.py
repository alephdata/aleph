# coding: utf-8
import os
import yaml
from hashlib import sha1
from celery import Task

PDF_MIME = 'application/pdf'


def checksum(filename):
    """Generate a hash for a given file name."""
    hash = sha1()
    with open(filename, 'rb') as fh:
        while True:
            block = fh.read(8192)
            if not block:
                break
            hash.update(block)
    return hash.hexdigest()


def load_config_file(file_path):
    """Load a YAML (or JSON) bulk load mapping file."""
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


def remove_nulls(data):
    """Remove None-valued keys from a dictionary, recursively."""
    if isinstance(data, dict):
        for k, v in data.items():
            if v is None:
                data.pop(k)
            data[k] = remove_nulls(v)
    elif is_list(data):
        data = [remove_nulls(d) for d in data if d is not None]
    return data


class SessionTask(Task):

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        from aleph.core import db
        db.session.remove()
