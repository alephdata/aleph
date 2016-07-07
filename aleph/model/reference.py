import logging

from aleph.core import db
from aleph.model.common import DatedModel, IdModel


log = logging.getLogger(__name__)


class Reference(db.Model, IdModel, DatedModel):
    id = db.Column(db.Integer(), primary_key=True)
    document_id = db.Column(db.BigInteger, db.ForeignKey('document.id'))
    entity_id = db.Column(db.String(32), db.ForeignKey('entity.id'))
    origin = db.Column(db.String(128))
    weight = db.Column(db.Integer)

    entity = db.relationship('Entity', backref=db.backref('references', lazy='dynamic'))
    document = db.relationship('Document', backref=db.backref('references', lazy='dynamic'))

    def get_collection_ids(self):
        from aleph.model.entity import collection_entity_table
        q = db.session.query(collection_entity_table.c.collection_id)
        q = q.filter(collection_entity_table.c.entity_id == self.entity_id)
        return [c for c, in q.all()]

    def to_dict(self):
        return {
            'entity': {
                'id': self.entity.id,
                'name': self.entity.name,
                '$schema': self.entity.type
            },
            'weight': self.weight,
            'origin': self.origin
        }

    def __repr__(self):
        return '<Reference(%r, %r)>' % (self.document_id, self.entity_id)
