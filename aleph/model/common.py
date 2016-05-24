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

    def to_dict(self):
        parent = super(IdModel, self)
        data = parent.to_dict() if hasattr(parent, 'to_dict') else {}
        data['id'] = self.id
        return data


class UuidModel(object):
    id = db.Column(db.String(32), primary_key=True, default=make_textid(),
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
    def all(cls):
        return db.session.query(cls)

    @classmethod
    def all_ids(cls):
        return db.session.query(cls.id)

    @classmethod
    def all_by_ids(cls, ids):
        return cls.all().filter(cls.id.in_(ids))

    @classmethod
    def by_id(cls, id):
        if id is None:
            return
        return cls.all().filter_by(id=id).first()

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
    def all(cls):
        q = super(SoftDeleteModel, cls).all()
        return q.filter(cls.deleted_at == None)  # noqa

    @classmethod
    def all_ids(cls):
        q = super(SoftDeleteModel, cls).all_ids()
        return q.filter(cls.deleted_at == None)  # noqa

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)

    def to_dict(self):
        parent = super(SoftDeleteModel, self)
        data = parent.to_dict() if hasattr(parent, 'to_dict') else {}
        data['deleted_at'] = self.deleted_at
        return data
