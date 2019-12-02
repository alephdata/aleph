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
    entities = db.Column('entities', db.ARRAY(db.Unicode))
    layout = db.Column('layout', JSONB)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role, backref=db.backref('diagrams', lazy='dynamic'))  # noqa

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('diagrams', lazy='dynamic'))  # noqa

    def update(self, data=None):
        self.updated_at = datetime.utcnow()
        if data:
            self.label = data.get('label', self.label)
            self.summary = data.get('summary', self.summary)
            self.entities = data.get('entities', self.entities)
            self.layout = data.get('layout', self.layout)
        db.session.add(self)
        db.session.commit()

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        data = self.to_dict_dates()
        data.update({
            'id': stringify(self.id),
            'label': self.label,
            'summary': self.summary,
            'entities': self.entities,
            'data': {'layout': dict(self.layout)},
            'role_id': stringify(self.role_id),
            'collection_id': stringify(self.collection_id),
        })
        return data

    @classmethod
    def by_collection(cls, collection_id):
        q = cls.all().filter(cls.collection_id == collection_id)
        return q

    @classmethod
    def create(cls, data,  collection, role_id):
        diagram = cls()
        diagram.role_id = role_id
        diagram.label = data.get('label')
        diagram.summary = data.get('summary')
        diagram.entities = data.get('entities')
        diagram.layout = data.get('layout')
        diagram.collection_id = collection.id
        diagram.update()
        return diagram

    def __repr__(self):
        return '<Diagram(%r, %r)>' % (self.id, self.collection_id)
