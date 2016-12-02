import logging
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db, schemata
from aleph.schema import Schema
from aleph.text import normalize_strong
from aleph.data.keys import make_fingerprint
from aleph.model.collection import Collection
from aleph.model.reference import Reference
from aleph.model.common import SoftDeleteModel, UuidModel, IdModel, DatedModel
from aleph.model.common import make_textid, merge_data

log = logging.getLogger(__name__)


class Entity(db.Model, UuidModel, SoftDeleteModel):
    STATE_ACTIVE = 'active'
    STATE_PENDING = 'pending'
    STATE_DELETED = 'deleted'

    name = db.Column(db.Unicode)
    type = db.Column(db.String(255), index=True)
    state = db.Column(db.String(128), nullable=True,
                      default=STATE_ACTIVE)
    data = db.Column('data', JSONB)

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('entities', lazy='dynamic'))

    def delete_references(self, origin=None):
        pq = db.session.query(Reference)
        pq = pq.filter(Reference.entity_id == self.id)
        if origin is not None:
            pq = pq.filter(Reference.origin == origin)
        pq.delete(synchronize_session='fetch')
        db.session.refresh(self)

    def delete(self, deleted_at=None):
        self.delete_references()
        deleted_at = deleted_at or datetime.utcnow()
        for alert in self.alerts:
            alert.delete(deleted_at=deleted_at)
        self.state = self.STATE_DELETED
        super(Entity, self).delete(deleted_at=deleted_at)

    def merge(self, other):
        if self.id == other.id:
            raise ValueError("Cannot merge an entity with itself.")
        if self.collection_id != other.collection_id:
            raise ValueError("Cannot merge entities from different collections.")  # noqa

        data = merge_data(self.data, other.data)
        if self.name.lower() != other.name.lower():
            data = merge_data(data, {'alias': [other.name]})

        self.data = data
        self.state = self.STATE_ACTIVE
        self.created_at = min((self.created_at, other.created_at))
        self.updated_at = datetime.utcnow()

        # update alerts
        from aleph.model.alert import Alert
        q = db.session.query(Alert).filter(Alert.entity_id == other.id)
        q.update({'entity_id': self.id})

        # update document references
        from aleph.model.reference import Reference
        q = db.session.query(Reference).filter(Reference.entity_id == other.id)
        q.update({'entity_id': self.id})

        # delete source entities
        other.delete()
        db.session.add(self)
        db.session.commit()
        db.session.refresh(other)

    def update(self, data):
        schema = schemata.get(Schema.ENTITY, self.type)
        data = schema.validate(data)
        self.name = data.pop('name', None)
        self.state = data.pop('state', self.STATE_ACTIVE)
        self.data = data
        self.updated_at = datetime.utcnow()
        db.session.add(self)

    @classmethod
    def save(cls, data, collection, merge=False):
        ent = cls.by_id(data.get('id'))
        if ent is None:
            ent = cls()
            ent.type = data.pop('$schema', None)
            if ent.type is None:
                raise ValueError("No schema provided.")
            ent.id = make_textid()

        if merge:
            data = merge_data(data, ent.to_dict())

        if collection is None:
            raise ValueError("No collection specified.")

        ent.collection = collection
        ent.update(data)
        return ent

    @classmethod
    def filter_collections(cls, q, collections=None):
        if collections is None:
            return q
        collection_ids = []
        for collection in collections:
            if isinstance(collection, Collection):
                collection = collection.id
            collection_ids.append(collection)
        q = q.filter(Entity.collection_id.in_(collection_ids))
        return q

    @classmethod
    def by_id_set(cls, ids, collections=None):
        if not len(ids):
            return {}
        q = cls.all()
        q = cls.filter_collections(q, collections=collections)
        q = q.options(joinedload('collection'))
        q = q.filter(cls.id.in_(ids))
        entities = {}
        for ent in q:
            entities[ent.id] = ent
        return entities

    @classmethod
    def latest(cls):
        q = db.session.query(func.max(cls.updated_at))
        q = q.filter(cls.state == cls.STATE_ACTIVE)
        return q.scalar()

    @classmethod
    def all_by_document(cls, document_id):
        from aleph.model.reference import Reference
        q = cls.all()
        q = q.options(joinedload('collections'))
        q = q.filter(cls.state == cls.STATE_ACTIVE)
        q = q.join(Reference)
        q = q.filter(Reference.document_id == document_id)
        return q.distinct()

    @property
    def fingerprint(self):
        return make_fingerprint(self.name)

    @property
    def terms(self):
        terms = set([self.name])
        for alias in self.data.get('alias', []):
            terms.update(alias)
        return [t for t in terms if t is not None and len(t)]

    @property
    def regex_terms(self):
        # This is to find the shortest possible regex for each entity.
        # If, for example, and entity matches both "Al Qaeda" and
        # "Al Qaeda in Iraq, Syria and the Levant", it is useless to
        # search for the latter.
        terms = [' %s ' % normalize_strong(t) for t in self.terms]
        regex_terms = set()
        for term in terms:
            if len(term) < 4 or len(term) > 120:
                continue
            contained = False
            for other in terms:
                if other == term:
                    continue
                if other in term:
                    contained = True
            if not contained:
                regex_terms.add(term.strip())
        return regex_terms

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.name)

    def __unicode__(self):
        return self.name

    def to_dict(self):
        data = dict(self.data)
        data.update(super(Entity, self).to_dict())
        data.update({
            '$schema': self.type,
            'name': self.name,
            'state': self.state,
            'collection_id': self.collection_id
        })
        return data

    def to_ref(self):
        return {
            'id': self.id,
            'name': self.name,
            '$schema': self.type,
            'collection_id': self.collection_id
        }


class EntityIdentity(db.Model, IdModel, DatedModel):
    entity_id = db.Column(db.String(255), index=True)
    identity = db.Column(db.String(255), index=True)
