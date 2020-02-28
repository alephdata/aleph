import logging
from sqlalchemy import cast, or_
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.ext.hybrid import hybrid_property

from aleph.core import db
from aleph.model.role import Role
from aleph.model.event import Events
from aleph.model.common import DatedModel, IdModel

log = logging.getLogger(__name__)


class Notification(db.Model, IdModel, DatedModel):
    _event = db.Column('event', db.String(255), nullable=False)
    channels = db.Column(ARRAY(db.String(255)), index=True)
    params = db.Column(JSONB)

    actor_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    actor = db.relationship(Role)

    @hybrid_property
    def event(self):
        return Events.get(self._event)

    @event.setter
    def event(self, event):
        self._event = event.name

    def iterparams(self):
        if self.actor_id is not None:
            yield 'actor', Role, self.actor_id
        if self.event is None:
            return
        for name, clazz in self.event.params.items():
            value = self.params.get(name)
            if value is not None:
                yield name, clazz, value

    def to_dict(self):
        data = self.to_dict_dates()
        data.update({
            'id': self.id,
            'actor_id': self.actor_id,
            'event': self._event,
            'params': self.params
        })
        return data

    @classmethod
    def publish(cls, event, actor_id=None, channels=[], params={}):
        notf = cls()
        notf.event = event
        notf.actor_id = actor_id
        notf.params = params
        notf.channels = list(set([c for c in channels if c is not None]))
        db.session.add(notf)
        return notf

    @classmethod
    def by_channels(cls, channels, role, since=None):
        channels = cast(channels, ARRAY(db.String(255)))
        q = cls.all()
        q = q.filter(cls.channels.overlap(channels))
        q = q.filter(cls._event.in_(Events.names()))
        q = q.filter(or_(
            cls.actor_id != role.id,
            cls.actor_id == None  # noqa
        ))
        since = since or role.notified_at
        if since is not None and role.notified_at is not None:
            since = max(since, role.notified_at)
        if since is not None:
            q = q.filter(cls.created_at >= since)
        q = q.order_by(cls.created_at.desc())
        return q

    @classmethod
    def delete_by_channel(cls, channel):
        q = cls.all()
        q = q.filter(cls.channels.any(channel))
        q.delete(synchronize_session=False)
