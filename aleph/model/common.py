import uuid
import string
from hashlib import sha1
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import ARRAY

from aleph.core import db
from aleph.text import string_value


ALPHABET = string.ascii_lowercase + string.digits


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
        for k, v in merge.items():
            b = base.get(k, v)
            data[k] = merge_data(b, v)
        return data
    return merge if base is None else base


class IdModel(object):
    id = db.Column(db.Integer(), primary_key=True)

    def to_dict(self):
        parent = super(IdModel, self)
        data = parent.to_dict() if hasattr(parent, 'to_dict') else {}
        data['id'] = self.id
        return data


class UuidModel(object):
    id = db.Column(db.String(32), primary_key=True, default=make_textid,
                   nullable=False, unique=False)

    def to_dict(self):
        parent = super(UuidModel, self)
        data = parent.to_dict() if hasattr(parent, 'to_dict') else {}
        data['id'] = self.id
        return data


class DatedModel(object):
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    @classmethod
    def all(cls, deleted=False):
        return db.session.query(cls)

    @classmethod
    def all_ids(cls, deleted=False):
        return db.session.query(cls.id)

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

    def to_dict(self):
        parent = super(DatedModel, self)
        data = parent.to_dict() if hasattr(parent, 'to_dict') else {}
        data['created_at'] = self.created_at
        data['updated_at'] = self.updated_at
        return data


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

    def to_dict(self):
        parent = super(SoftDeleteModel, self)
        data = parent.to_dict() if hasattr(parent, 'to_dict') else {}
        data['deleted_at'] = self.deleted_at
        return data


class ModelFacets(object):

    @classmethod
    def facet_by(cls, q, field, filter_null=False, mapping={}):
        if isinstance(field.property.columns[0].type, ARRAY):
            field = func.unnest(field)
        cnt = func.count(field)
        q = q.from_self(field, cnt)
        q = q.group_by(field)
        q = q.order_by(cnt.desc())
        return [{'id': v, 'label': mapping.get(v, v), 'count': c}
                for v, c in q if v is not None]
