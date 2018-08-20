import logging
from sqlalchemy import or_
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, array_agg
from sqlalchemy.ext.hybrid import hybrid_property

from aleph.core import db
from aleph.model.role import Role
from aleph.model.event import Events
from aleph.model.subscription import Subscription
from aleph.model.common import DatedModel, IdModel

log = logging.getLogger(__name__)


class Notification(db.Model, IdModel, DatedModel):
    GLOBAL = 'Global'

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

    @property
    def recipients(self):
        q = db.session.query(Role)
        q = q.join(Subscription, Subscription.role_id == Role.id)
        q = q.filter(Subscription.channel.in_(self.channels))
        q = q.filter(Role.email != None) # noqa
        q = q.filter(Role.deleted_at == None) # noqa
        q = q.filter(Subscription.deleted_at == None) # noqa
        q = q.distinct()
        return q

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
    def by_role(cls, role, since=None):
        columns = array_agg(Subscription.channel).label('channels')
        sq = db.session.query(columns)
        sq = sq.filter(Subscription.deleted_at == None)  # noqa
        sq = sq.filter(Subscription.role_id == role.id)
        sq = sq.cte('sq')
        q = cls.all()
        q = q.filter(or_(
            cls.actor_id != role.id,
            cls.actor_id == None  # noqa
        ))
        q = q.filter(cls.channels.overlap(sq.c.channels))
        q = q.filter(cls._event.in_(Events.names()))
        if since is not None:
            q = q.filter(cls.created_at >= since)
        if role.notified_at is not None:
            q = q.filter(cls.created_at >= role.notified_at)
        q = q.order_by(cls.created_at.desc())
        q = q.order_by(cls.id.desc())
        return q

    @classmethod
    def by_channel(cls, channel):
        q = cls.all()
        q = q.filter(cls.channels.any(channel))
        q = q.filter(cls._event.in_(Events.names()))
        q = q.order_by(cls.created_at.desc())
        q = q.order_by(cls.id.desc())
        return q

    @classmethod
    def delete_by_channel(cls, channel):
        q = cls.all()
        q = q.filter(cls.channels.any(channel))
        q.delete(synchronize_session=False)
