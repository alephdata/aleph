import uuid
from banal import ensure_list
from itertools import chain
from datetime import datetime
from normality import stringify

from aleph.core import db


def make_textid():
    return uuid.uuid4().hex


def string_set(*lists):
    """Make a list of clean strings."""
    # Used by entity for foreign_ids.
    items = chain(*[ensure_list(l) for l in lists])
    items = [stringify(i) for i in items]
    items = [i for i in items if i is not None]
    return list(set(items))


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


class EventsEnumMeta(type):
    def __init__(cls, name, bases, kwds):
        for name, value in kwds.items():
            if name.upper() != name:
                continue
            value['name'] = name
            kwds['__all__'][name] = value
        super(EventsEnumMeta, cls).__init__(name, bases, kwds)


class EventsEnum(object):
    __metaclass__ = EventsEnumMeta

    @classmethod
    def get(cls, name):
        return cls.__all__.get(name)
