import logging

from aleph.core import db
from aleph.model.common import DatedModel, IdModel


log = logging.getLogger(__name__)


class Reference(db.Model, IdModel, DatedModel):
    id = db.Column(db.Integer(), primary_key=True)
    origin = db.Column(db.String(128))
    weight = db.Column(db.Integer)

    document_id = db.Column(db.BigInteger, db.ForeignKey('document.id'), index=True)  # noqa
    document = db.relationship('Document', backref=db.backref('references', lazy='dynamic'))  # noqa

    entity_id = db.Column(db.String(32), db.ForeignKey('entity.id'), index=True)  # noqa
    entity = db.relationship('Entity', backref=db.backref('references', lazy='dynamic'))  # noqa

    @classmethod
    def index_references(cls, document_id):
        """Helper function to get reference data for indexing."""
        # cf. aleph.index.entities.generate_entities()
        from aleph.model.entity import Entity
        q = db.session.query(Reference.entity_id, Entity.collection_id)
        q = q.filter(Reference.document_id == document_id)
        q = q.filter(Entity.id == Reference.entity_id)
        q = q.filter(Entity.state == Entity.STATE_ACTIVE)
        return q.all()

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
