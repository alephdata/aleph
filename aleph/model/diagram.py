import logging
from datetime import datetime
from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.common import SoftDeleteModel


log = logging.getLogger(__name__)


class Diagram(db.Model, SoftDeleteModel):
    """A mapping to load entities from a table"""
    __tablename__ = 'diagram'

    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.Unicode)
    summary = db.Column(db.Unicode, nullable=True)
    # list of entity ids
    entities = db.Column('entities', db.ARRAY(db.Unicode))
    layout = db.Column('layout', JSONB)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role, backref=db.backref('diagrams', lazy='dynamic'))  # noqa

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref(
        'diagrams', lazy='dynamic', cascade="all, delete-orphan"
    ))

    def update(self, data, collection):
        self.updated_at = datetime.utcnow()
        self.deleted_at = None
        self.label = data.get('label', self.label)
        self.summary = data.get('summary', self.summary)
        self.entities = data.get('entities', self.entities)
        self.layout = data.get('layout', self.layout)
        entities = []
        for ent_id in self.entities:
            signed_ent_id = collection.ns.sign(ent_id)
            if signed_ent_id is None:
                raise ValueError("Invalid ent_id: %s" % ent_id)
            entities.append(signed_ent_id)
        self.entities = entities
        db.session.add(self)

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)

    def to_dict(self):
        data = self.to_dict_dates()
        data.update({
            'id': stringify(self.id),
            'label': self.label,
            'summary': self.summary,
            'entities': self.entities,
            'layout': self.layout,
            'role_id': stringify(self.role_id),
            'collection_id': stringify(self.collection_id),
        })
        return data

    @classmethod
    def by_authz(cls, authz):
        ids = authz.collections(authz.READ)
        q = cls.all()
        q = q.filter(cls.collection_id.in_(ids))
        return q

    @classmethod
    def delete_by_collection(cls, collection_id):
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq.delete(synchronize_session=False)

    @classmethod
    def create(cls, data,  collection, role_id):
        diagram = cls()
        diagram.layout = {}
        diagram.entities = []
        diagram.role_id = role_id
        diagram.collection_id = collection.id
        diagram.update(data, collection)
        return diagram

    def __repr__(self):
        return '<Diagram(%r, %r)>' % (self.id, self.collection_id)
