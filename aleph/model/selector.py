import logging
from datetime import datetime

from sqlalchemy.ext.hybrid import hybrid_property
from normality import normalize

from aleph.core import db

log = logging.getLogger(__name__)


class Selector(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    _text = db.Column('text', db.Unicode, index=True)
    normalized = db.Column(db.Unicode, index=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    entity_id = db.Column(db.Unicode(50), db.ForeignKey('entity.id'))
    entity = db.relationship('Entity', backref=db.backref('selectors',
                             lazy='dynamic', cascade='all, delete-orphan')) # noqa

    @hybrid_property
    def text(self):
        return self._text

    @text.setter
    def text(self, text):
        self._text = text
        self.normalized = self.normalize(text)

    @classmethod
    def normalize(cls, text):
        return normalize(text)

    def __repr__(self):
        return '<Selector(%r, %r)>' % (self.entity_id, self.text)

    def __unicode__(self):
        return self.text
