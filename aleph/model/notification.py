import logging
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from aleph.core import db
from aleph.model.role import Role
from aleph.model.common import DatedModel

log = logging.getLogger(__name__)


class Notification(db.Model, DatedModel):
    PREFIX_ENTITY = 'entity:'
    PREFIX_COLLECTION = 'collection:'
    PREFIX_ROLE = 'role:'

    event = db.Column(db.String(255))
    channels = db.Column(ARRAY(db.String(255)))
    params = db.Column(JSONB)

    actor_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    actor = db.relationship(Role)

    @classmethod
    def notify(cls, actor_id, event, channels=[], params={}):
        notification = cls()
        notification.actor_id = actor_id
        notification.event = event
        notification.channels = channels
        notification.params = params
        db.session.add(notification)
        return notification
