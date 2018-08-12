import logging
from banal import hash_data
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.role import Role

log = logging.getLogger(__name__)


class Audit(db.Model):
    """Records a single activity"""
    __tablename__ = 'audit'

    ACT_LOGIN = 'LOGIN'
    ACT_SEARCH = 'SEARCH'
    ACT_ENTITY = 'VIEW_ENITTY'
    ACT_COLLECTION = 'VIEW_COLLECTION'

    id = db.Column(db.String(40), primary_key=True)
    activity = db.Column(db.Unicode, nullable=True)
    data = db.Column(JSONB, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role)

    session_id = db.Column(db.Unicode, nullable=True)
    count = db.Column(db.Integer, default=1, nullable=True)

    @classmethod
    def all(cls):
        return db.session.query(cls)

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
    def save(cls, activity, session_id, role_id, data, keys):
        keys = [data.get(k) for k in keys]
        key = hash_data([activity, session_id, role_id, keys])
        obj = cls.all().filter_by(id=key).first()
        if obj is None:
            obj = cls()
            obj.id = key
            obj.activity = activity
            obj.role_id = role_id
            obj.session_id = session_id
            obj.data = data
        else:
            obj.count += 1
        obj.updated_at = datetime.utcnow()
        db.session.add(obj)

    def __repr__(self):
        return '<Audit(%r, %r, %r)>' % (self.id, self.activity, self.role_id)
