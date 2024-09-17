import contextlib
import uuid
import secrets
import logging
from sqlalchemy import false
from sqlalchemy.sql.expression import select
from datetime import datetime, date
from flask_babel import lazy_gettext

from aleph.core import db

log = logging.getLogger(__name__)
ENTITY_ID_LEN = 128


def make_textid():
    return uuid.uuid4().hex


def make_token():
    return secrets.token_urlsafe()


def iso_text(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    return obj


def query_like(column, text):
    if text is None or len(text) < 3:
        return false()
    text = text.replace("%", " ").replace("_", " ")
    text = "%%%s%%" % text
    return column.ilike(text)


class IdModel(object):
    id = db.Column(db.Integer(), primary_key=True)


class DatedModel(object):
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

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
        return db.session.scalars(select(cls).filter_by(id=id).limit(1)).first()

    def delete(self):
        # hard delete
        db.session.delete(self)

    def to_dict_dates(self):
        return {"created_at": self.created_at, "updated_at": self.updated_at}


class SoftDeleteModel(DatedModel):
    deleted_at = db.Column(db.DateTime, default=None, nullable=True)

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)

    def to_dict_dates(self):
        data = super(SoftDeleteModel, self).to_dict_dates()
        if self.deleted_at:
            data["deleted_at"] = self.deleted_at
        return data

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

    @classmethod
    def cleanup_deleted(cls):
        pq = db.session.query(cls)
        pq = pq.filter(cls.deleted_at != None)  # noqa
        log.info("[%s]: %d deleted objects", cls.__name__, pq.count())
        pq.delete(synchronize_session=False)


class Status(object):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    DEFAULT = PENDING

    LABEL = {
        PENDING: lazy_gettext("pending"),
        SUCCESS: lazy_gettext("successful"),
        FAILED: lazy_gettext("failed"),
    }
