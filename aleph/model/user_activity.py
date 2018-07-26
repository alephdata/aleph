from datetime import datetime
from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.role import Role


class UserActivity(db.Model):
    """Records a single activity of a user"""
    __tablename__ = 'user_activity'

    id = db.Column(db.Integer, primary_key=True)
    activity_type = db.Column(db.Unicode, nullable=True)
    activity_metadata = db.Column(JSONB, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role)

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
    def create(cls, data, role_id):
        activity = cls()
        activity.role_id = role_id
        activity.activity_type = stringify(data.pop('activity_type'))
        activity.activity_metadata = data
        db.session.add(activity)
        db.session.flush()
        return activity

    def __repr__(self):
        return '<Activity(%r, %r, %r)>' % (
            self.id, self.activity_type, self.role_id
        )
