import logging
from datetime import datetime

from aleph.core import db, url_for
from aleph.model.role import Role
from aleph.model.validation import validate
from aleph.model.common import SoftDeleteModel

log = logging.getLogger(__name__)


class Collection(db.Model, SoftDeleteModel):
    id = db.Column(db.Integer(), primary_key=True)
    label = db.Column(db.Unicode)
    foreign_id = db.Column(db.Unicode, unique=True, nullable=False)

    creator_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    creator = db.relationship(Role)

    def update(self, data):
        validate(data, 'collection.json#')
        self.label = data.get('label')
        self.touch()

    def delete(self):
        self.delete_entities()
        db.session.delete(self)

    def touch(self):
        self.updated_at = datetime.utcnow()
        db.session.add(self)

    @property
    def terms(self):
        from aleph.model.entity import Entity, Selector
        q = db.session.query(Selector.text)
        q = q.join(Entity, Entity.id == Selector.entity_id)
        q = q.filter(Entity.collection_id == self.id)
        q = q.distinct()
        return set([r[0] for r in q])

    @classmethod
    def by_foreign_id(cls, foreign_id, data, role=None):
        q = cls.all().filter(cls.foreign_id == foreign_id)
        collection = q.first()
        if collection is None:
            collection = cls.create(data, role)
            collection.foreign_id = foreign_id
        collection.update(data)
        db.session.add(collection)
        db.session.flush()
        return collection

    @classmethod
    def create(cls, data, role):
        collection = cls()
        collection.update(data)
        collection.creator = role
        db.session.add(collection)
        return collection

    @classmethod
    def all_by_ids(cls, ids):
        return cls.all().filter(cls.id.in_(ids))

    @classmethod
    def timestamps(cls):
        q = db.session.query(cls.id, cls.updated_at)
        q = q.filter(cls.deleted_at == None)  # noqa
        return q.all()

    def __repr__(self):
        return '<Collection(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label

    def to_dict(self):
        return {
            'id': self.id,
            'api_url': url_for('collections_api.view', id=self.id),
            'label': self.label,
            'foreign_id': self.foreign_id,
            'creator_id': self.creator_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
