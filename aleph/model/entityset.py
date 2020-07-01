import logging
from datetime import datetime
from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.common import SoftDeleteModel
from aleph.model.common import ENTITY_ID_LEN, make_textid

log = logging.getLogger(__name__)


class EntitySet(db.Model, SoftDeleteModel):
    __tablename__ = 'entityset'

    # set types
    GENERIC = 'generic'
    DIAGRAM = 'diagram'
    TIMELINE = 'timeline'

    TYPES = [GENERIC, DIAGRAM, TIMELINE]

    id = db.Column(db.String(ENTITY_ID_LEN), primary_key=True)
    label = db.Column(db.Unicode)
    type = db.Column(db.String(10), index=True, default=GENERIC)
    summary = db.Column(db.Unicode, nullable=True)
    layout = db.Column('layout', JSONB, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role)

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection)

    parent_id = db.Column(db.String(ENTITY_ID_LEN), db.ForeignKey('entityset.id'))  # noqa
    parent = db.relationship('EntitySet', backref='children', remote_side=[id])

    entities = db.relationship('EntitySetItem', backref='entityset')

    def update(self, data, collection):
        self.label = data.get('label', self.label)
        self.type = data.get('type', self.type)
        self.summary = data.get('summary', self.summary)
        self.layout = data.get('layout', self.layout)
        self.updated_at = datetime.utcnow()
        self.deleted_at = None
        db.session.add(self)
        self.update_entities(data.get('entities', []))

    def update_entities(self, entities):
        seen = set()
        q = EntitySetItem.all(deleted=True)
        q = q.filter(EntitySetItem.entityset_id == self.id)
        for item in q:
            seen.add(item.entity_id)
            if item.entity_id in entities and item.deleted_at:
                item.deleted_at = None
                db.session.add(item)
            if item.entity_id not in entities and not item.deleted_at:
                item.deleted_at = self.updated_at
                db.session.add(item)

        for entity_id in entities:
            if entity_id in seen:
                continue
            item = EntitySetItem()
            item.collection_id = self.collection_id
            item.entityset_id = self.id
            item.entity = entity_id
            item.created_at = self.updated_at
            item.updated_at = self.updated_at
            db.session.add(item)

    def delete(self, deleted_at=None):
        pq = db.session.query(EntitySetItem)
        pq = pq.filter(EntitySetItem.entityset_id == self.id)
        pq = pq.filter(EntitySetItem.deleted_at == None)  # noqa
        pq.update({EntitySetItem.deleted_at: deleted_at},
                  synchronize_session=False)

        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)

    def to_dict(self):
        data = self.to_dict_dates()
        data.update({
            'id': stringify(self.id),
            'type': self.type,
            'label': self.label,
            'summary': self.summary,
            'entities': [e.entity_id for e in self.entities],
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
    def delete_by_collection(cls, collection_id, deleted_at):
        EntitySetItem.delete_by_collection(collection_id, deleted_at)

        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at},
                  synchronize_session=False)

    @classmethod
    def create(cls, data, collection, authz):
        entityset = cls()
        entityset.id = make_textid()
        entityset.layout = {}
        entityset.role_id = authz.id
        entityset.collection_id = collection.id
        entityset.update(data, collection)
        return entityset

    def __repr__(self):
        return '<EntitySet(%r, %r)>' % (self.id, self.collection_id)


class EntitySetItem(db.Model, SoftDeleteModel):
    __tablename__ = 'entityset_item'

    id = db.Column(db.Integer, primary_key=True)
    entityset_id = db.Column(db.String(ENTITY_ID_LEN), db.ForeignKey('entityset.id'), index=True)  # noqa
    entity_id = db.Column(db.String(ENTITY_ID_LEN), index=True)
    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at):
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at},
                  synchronize_session=False)

        pq = db.session.query(cls)
        pq = pq.filter(EntitySet.collection_id == collection_id)
        pq = pq.filter(EntitySet.id == cls.entityset_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at},
                  synchronize_session=False)

    def __repr__(self):
        return '<EntitySetItem(%r, %r)>' % (self.entityset_id, self.entity_id)
