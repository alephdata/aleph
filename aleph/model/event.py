from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db


class Event(db.Model):
    """Report any events or errors during processing of documents."""

    id = db.Column(db.BigInteger, primary_key=True)
    origin = db.Column(db.Unicode, unique=False)
    data = db.Column(JSONB)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return '<Event(%r,%r)>' % (self.id, self.origin)

    def __unicode__(self):
        return self.id
