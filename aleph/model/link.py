import logging
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from aleph.core import db, schemata
from aleph.model.collection import Collection
from aleph.model.common import SoftDeleteModel, UuidModel

log = logging.getLogger(__name__)


class Link(db.Model, UuidModel, SoftDeleteModel):
    type = db.Column(db.String(255), index=True)
    source_id = db.Column(db.String(254), index=True)
    target_id = db.Column(db.String(254), index=True)
    foreign_ids = db.Column(ARRAY(db.Unicode()))
    data = db.Column('data', JSONB)

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('links', lazy='dynamic'))  # noqa

    @property
    def schema(self):
        return schemata.get(self.type)

    def to_dict(self):
        data = super(Link, self).to_dict()
        data.update({
            'schema': self.type,
            'data': self.data,
            'foreign_ids': self.foreign_ids or [],
            'collection_id': self.collection_id
        })
        return data

    def __repr__(self):
        return '<Link(%r, %r, %r)>' % (self.id, self.source_id, self.target_id)
