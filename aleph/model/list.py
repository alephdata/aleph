import logging
from datetime import datetime

from aleph.core import db
from aleph.model.user import User
from aleph.model.util import make_textid

log = logging.getLogger(__name__)


class List(db.Model):
    id = db.Column(db.Integer(), primary_key=True, default=make_textid)
    label = db.Column(db.Unicode)

    creator_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    creator = db.relationship(User, backref=db.backref('lists',
                              lazy='dynamic'))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'label': self.label,
            'creator_id': self.creator_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    def __repr__(self):
        return '<List(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label
