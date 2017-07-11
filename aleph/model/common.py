import uuid
from hashlib import sha1
from datetime import datetime

from aleph.core import db
from aleph.text import string_value


def make_textid():
    return uuid.uuid4().hex


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
        merge = merge or dict()
        for k, v in merge.items():
            b = base.get(k, v)
            data[k] = merge_data(b, v)
        return data
    return merge if base is None else base


class IdModel(object):
    id = db.Column(db.Integer(), primary_key=True)


class UuidModel(object):
    id = db.Column(db.String(32), primary_key=True, default=make_textid,
                   nullable=False, unique=False)


class DatedModel(object):
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    @classmethod
    def all(cls, deleted=False):
        return db.session.query(cls)

    @classmethod
    def all_ids(cls, deleted=False):
        q = db.session.query(cls.id)
        q = q.order_by(cls.id.asc())
        return q

    @classmethod
    def all_by_ids(cls, ids, deleted=False):
        return cls.all(deleted=deleted).filter(cls.id.in_(ids))

    @classmethod
    def by_id(cls, id, deleted=False):
        if id is None:
            return
        return cls.all(deleted=deleted).filter_by(id=id).first()

    def delete(self, deleted_at=None):
        # hard delete
        db.session.delete(self)


class SoftDeleteModel(DatedModel):
    deleted_at = db.Column(db.DateTime, default=None, nullable=True)

    @classmethod
    def all(cls, deleted=False):
        q = super(SoftDeleteModel, cls).all()
        if not deleted:
            q = q.filter(cls.deleted_at == None)  # noqa
        return q

    @classmethod
    def all_ids(cls, deleted=False):
        q = super(SoftDeleteModel, cls).all_ids()
        if not deleted:
            q = q.filter(cls.deleted_at == None)  # noqa
        return q

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)
