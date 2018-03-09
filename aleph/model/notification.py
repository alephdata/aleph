import logging
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from aleph.core import db
from aleph.model.role import Role
from aleph.model.event import Events
from aleph.model.common import DatedModel, IdModel

log = logging.getLogger(__name__)


class Notification(db.Model, IdModel, DatedModel):
    _event = db.Column('event', db.String(255))
    channels = db.Column(ARRAY(db.String(255)))
    params = db.Column(JSONB)

    actor_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    actor = db.relationship(Role)

    @property
    def event(self):
        return Events.get(self._event)

    @event.setter
    def event(self, event):
        if isinstance(event, dict):
            event = event.get('name')
        self._event = event

    @classmethod
    def publish(cls, event, actor_id=None, channels=[], params={}):
        notf = cls()
        notf.event = event
        notf.actor_id = actor_id
        notf.params = {k: v for (k, v) in params.items() if v is not None}

        channels = [c for c in channels if c is not None]
        notf.channels = list(set(channels))
        db.session.add(notf)
        return notf
