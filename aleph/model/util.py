from hashlib import sha1
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import ARRAY

from aleph.text import string_value


class ModelFacets(object):

    @classmethod
    def facet_by(cls, q, field, filter_null=False):
        if isinstance(field.property.columns[0].type, ARRAY):
            field = func.unnest(field)
        cnt = func.count(field)
        q = q.from_self(field, cnt)
        q = q.group_by(field)
        q = q.order_by(cnt.desc())
        return [{'value': v, 'count': c} for v, c in q if v is not None]


def object_key(obj):
    """Generate a checksum for a nested object or list."""
    key = sha1()

    if isinstance(obj, (list, set, tuple)):
        for o in obj:
            o = object_key(o)
            if o is not None:
                key.update(o)
    elif isinstance(obj, dict):
        for k, v in obj.items():
            v = object_key(v)
            if v is not None:
                key.update(k)
                key.update(v)
    else:
        v = string_value(obj)
        if v is not None:
            key.update(v.encode('utf-8'))

    return key.hexdigest()


def merge_data(base, merge):
    """Merge two objects such that values in base are kept
    and updated only if merge has additional info."""
    if isinstance(base, (list, set, tuple)):
        data = base + merge
        data = {object_key(d): d for d in data}
        return data.values()
    if isinstance(base, dict):
        data = dict(base)
        for k, v in merge.items():
            b = base.get(k, v)
            data[k] = merge_data(b, v)
        return data
    return merge if base is None else base