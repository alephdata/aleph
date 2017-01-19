import logging
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.common import IdModel, DatedModel

log = logging.getLogger(__name__)


class EventLog(db.Model, IdModel, DatedModel):
    action = db.Column(db.Unicode(255), index=True)
    source_ip = db.Column(db.Unicode(255), nullable=True)
    path = db.Column(db.Unicode(), nullable=True)
    query = db.Column(JSONB)
    data = db.Column(JSONB)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)

    @classmethod
    def emit(cls, action, path, source_ip=None, query=None, data=None,
             role_id=None):
        event = EventLog()
        event.action = action
        event.source_ip = source_ip
        event.path = path
        event.query = query
        event.data = data
        if role_id is not None:
            event.role_id = role_id
        db.session.add(event)
        return event

    def __repr__(self):
        return '<EventLog(%r, %r)>' % (self.id, self.action)

    def __unicode__(self):
        return self.action
