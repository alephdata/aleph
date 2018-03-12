import logging
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.ext.hybrid import hybrid_property

from aleph.core import db
from aleph.model.role import Role
from aleph.model.event import Event, Events
from aleph.model.subscription import Subscription
from aleph.model.common import DatedModel, IdModel

log = logging.getLogger(__name__)


class Notification(db.Model, IdModel, DatedModel):
    GLOBAL = 'Global'

    _event = db.Column('event', db.String(255))
    channels = db.Column(ARRAY(db.String(255)))
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
    def by_role(cls, role):
        sq = db.session.query(Subscription.channel)
        sq = sq.filter(Subscription.deleted_at == None)  # noqa
        sq = sq.filter(Subscription.role_id == role.id)
        sq = sq.cte('sq')
        q = cls.all()
        q = q.filter(cls.actor_id != role.id)
        q = q.filter(cls.channels.any(sq.c.channel))
        q = q.filter(cls._event.in_(Events.names()))
        q = q.order_by(cls.created_at.desc())
        q = q.order_by(cls.id.desc())
        return q
