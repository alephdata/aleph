from datetime import datetime
import logging

from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.role import Role


log = logging.getLogger(__name__)


class Audit(db.Model):
    """Records a single activity"""
    __tablename__ = 'audit'

    id = db.Column(db.Integer, primary_key=True)
    activity_type = db.Column(db.Unicode, nullable=True)
    activity_metadata = db.Column(JSONB, nullable=True)
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
    def by_type(cls, activity_type, role_id=None):
        q = cls.all().filter_by(activity_type=activity_type)
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
    def create_or_update(cls, data):
        role_id = data.pop('role_id')
        session_id = data.pop('session_id')
        activity_type = stringify(data.pop('activity_type'))
        q = cls.all().filter_by(
            role_id=role_id, session_id=session_id, activity_type=activity_type
        )
        for key, val in data.items():
            q = q.filter(cls.activity_metadata.contains({key: val}))
        activity = q.first()
        if activity is None:
            data['role_id'] = role_id
            data['session_id'] = session_id
            data['activity_type'] = activity_type
            return cls.create(data)
        else:
            activity.count += 1
            activity.updated_at = datetime.utcnow()
            db.session.add(activity)
            db.session.flush()
            return activity

    @classmethod
    def create(cls, data):
        activity = cls()
        activity.role_id = data.pop('role_id')
        activity.session_id = data.pop('session_id')
        activity.activity_type = stringify(data.pop('activity_type'))
        activity.activity_metadata = data
        activity.updated_at = datetime.utcnow()
        db.session.add(activity)
        db.session.flush()
        return activity

    def __repr__(self):
        return '<Audit(%r, %r, %r)>' % (
            self.id, self.activity_type, self.role_id
        )
