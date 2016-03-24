import uuid
import string
from datetime import datetime

from aleph.core import db


ALPHABET = string.ascii_lowercase + string.digits


def make_token():
    num = uuid.uuid4().int
    s = []
    while True:
        num, r = divmod(num, len(ALPHABET))
        s.append(ALPHABET[r])
        if num == 0:
            break
    return ''.join(reversed(s))


def make_textid():
    return uuid.uuid4().hex


class IdModel(object):
    id = db.Column(db.Integer(), primary_key=True)


class DatedModel(object):
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    @classmethod
    def all(cls):
        return db.session.query(cls)

    @classmethod
    def all_ids(cls):
        return db.session.query(cls.id)

    @classmethod
    def by_id(cls, id):
        return cls.all().filter_by(id=id).first()

    def delete(self):
        # hard delete
        db.session.delete(self)


class SoftDeleteModel(DatedModel):
    deleted_at = db.Column(db.DateTime, default=None, nullable=True)

    @classmethod
    def all(cls):
        q = super(SoftDeleteModel, cls).all()
        return q.filter(cls.deleted_at == None)  # noqa

    @classmethod
    def all_ids(cls):
        q = super(SoftDeleteModel, cls).all_ids()
        return q.filter(cls.deleted_at == None)  # noqa

    def delete(self):
        self.deleted_at = datetime.utcnow()
        db.session.add(self)
