import logging
from banal import hash_data
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.role import Role
from aleph.model.common import DatedModel

log = logging.getLogger(__name__)


class Audit(db.Model, DatedModel):
    """Records a single activity"""
    __tablename__ = 'audit'

    ACT_LOGIN = 'LOGIN'
    ACT_SEARCH = 'SEARCH'
    ACT_ENTITY = 'VIEW_ENITTY'
    ACT_COLLECTION = 'VIEW_COLLECTION'

    id = db.Column(db.String(40), primary_key=True)
    activity = db.Column(db.Unicode, nullable=True)
    data = db.Column(JSONB, nullable=True)
    session_id = db.Column(db.Unicode, nullable=True)
    count = db.Column(db.Integer, default=1, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role)

    @classmethod
    def by_activity(cls, activity, role_id=None):
        q = cls.all().filter_by(activity=activity)
        if role_id is not None:
            q = q.filter(cls.role_id == role_id)
        return q

    @classmethod
    def by_role_id(cls, role_id):
        q = cls.all()
        q = q.filter(cls.role_id == role_id)
        q = q.order_by(cls.created_at.desc())
        q = q.order_by(cls.id.desc())
        return q

    @classmethod
    def query_log(cls, role_id=None, session_id=None):
        text = cls.data['text'].astext.cast(db.Unicode).label('text')
        created_at = func.min(cls.created_at).label('created_at')
        updated_at = func.max(cls.updated_at).label('updated_at')
        count = func.sum(cls.count).label('count')
        q = db.session.query(text, created_at, updated_at, count)
        if role_id is not None:
            q = q.filter(cls.role_id == role_id)
        else:
            q = q.filter(cls.session_id == session_id)
        q = q.filter(cls.activity == cls.ACT_SEARCH)
        q = q.filter(text != None)  # noqa
        q = q.group_by(text)
        q = q.order_by(updated_at.desc())
        return q

    @classmethod
    def save(cls, activity, session_id, role_id, timestamp, data, keys):
        keys = [data.get(k) for k in keys]
        key = hash_data([activity, session_id, keys])
        obj = cls.all().filter_by(id=key).first()
        if obj is None:
            obj = cls()
            obj.id = key
            obj.activity = activity
            obj.session_id = session_id
            obj.created_at = timestamp
            obj.data = data
            obj.count = 0

        obj.count += 1
        obj.role_id = role_id
        obj.updated_at = timestamp
        db.session.add(obj)

    def __repr__(self):
        return '<Audit(%r, %r, %r)>' % (self.id, self.activity, self.role_id)
