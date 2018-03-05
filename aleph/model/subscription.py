import logging
from datetime import datetime

from aleph.core import db
from aleph.model.role import Role
from aleph.model.common import SoftDeleteModel

log = logging.getLogger(__name__)


class Subscription(db.Model, SoftDeleteModel):
    channel = db.Column(db.String(255), index=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role)

    @classmethod
    def find(cls, channel=None, role_id=None, deleted=False):
        q = cls.all(deleted=deleted)
        if channel is not None:
            q = q.filter(cls.channel == channel)
        if role_id is not None:
            q = q.filter(cls.role_id == role_id)
        return q.first()

    @classmethod
    def subscribe(cls, role, channel):
        subscription = cls.find(channel=channel, role_id=role.id)
        if subscription is None:
            subscription = cls()
        subscription.channel = channel
        subscription.role_id = role.id
        subscription.deleted_at = None
        db.session.add(subscription)
        return subscription

    @classmethod
    def unsubscribe(cls, role=None, channel=None, deleted_at=None):
        assert role is not None or channel is not None
        if deleted_at is None:
            deleted_at = datetime.utcnow()
        q = db.session.query(cls)
        if role is not None:
            q = q.filter(cls.role_id == role.id)
        if channel is not None:
            q = q.filter(cls.channel == channel)
        q.update({cls.deleted_at: deleted_at},
                 synchronize_session=False)
