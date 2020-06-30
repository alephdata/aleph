import logging
from datetime import datetime
from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.common import SoftDeleteModel
from aleph.model.common import ENTITY_ID_LEN, make_textid

log = logging.getLogger(__name__)


class Types:
    # set types
    GENERIC = 'generic'
    DIAGRAM = 'diagram'
    TIMELINE = 'timeline'


class EntitySet(db.Model, SoftDeleteModel):
    __tablename__ = 'entityset'

    id = db.Column(db.String(ENTITY_ID_LEN), primary_key=True)
    label = db.Column(db.Unicode)
    type = db.Column(db.String(10), index=True, default=Types.GENERIC)
    summary = db.Column(db.Unicode, nullable=True)
    layout = db.Column('layout', JSONB)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role)

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection)

    parent_id = db.Column(db.String(ENTITY_ID_LEN), db.ForeignKey('entityset.id'), index=True)
    parent = db.relationship('EntitySet', backref='children', remote_side=[id])

    entities = db.relationship('EntitySetItem', backref='entityset')

    def update(self, data, collection):
        self.updated_at = datetime.utcnow()
        self.deleted_at = None
        self.label = data.get('label', self.label)
        self.type = data.get('type', self.type)
        self.summary = data.get('summary', self.summary)
        self.layout = data.get('layout', self.layout)
        self.id = data.get('id', self.id or make_textid())
        db.session.add(self)
        self.update_entities(data.get('entities', []), collection.id)

    def update_entities(self, entities, collection_id):
        existing_entities = [e.entity_id for e in self.entities]
        new_entities = set(entities) - set(existing_entities)
        delete_entities = set(existing_entities) - set(entities)
        db.session.query(EntitySetItem).filter_by(
            entityset_id=self.id).filter(
            EntitySetItem.entity_id.in_(delete_entities)).delete(synchronize_session=False)
        for entity_id in new_entities:
            esetitem = EntitySetItem(entity_id=entity_id, entityset_id=self.id, collection_id=collection_id)
            db.session.add(esetitem)

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)

    def to_dict(self):
        data = self.to_dict_dates()
        data.update({
            'id': stringify(self.id),
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
    def delete_by_collection(cls, collection_id, deleted_at=None):
        deleted_at = deleted_at or datetime.utcnow()
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at},
                  synchronize_session=False)

    @classmethod
    def create(cls, data, collection, role_id):
        eset = cls()
        eset.layout = {}
        eset.role_id = role_id
        eset.collection_id = collection.id
        eset.update(data, collection)
        return eset

    def __repr__(self):
        return '<EntitySet(%r, %r)>' % (self.id, self.collection_id)


class EntitySetItem(db.Model, SoftDeleteModel):
    __tablename__ = 'entityset_item'

    entityset_id = db.Column(db.String(ENTITY_ID_LEN), db.ForeignKey('entityset.id'), index=True, primary_key=True)  # noqa
    entity_id = db.Column(db.String(ENTITY_ID_LEN), index=True, primary_key=True)
    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa

    def __repr__(self):
        return '<EntitySetItem(%r, %r)>' % (self.entityset_id, self.entity_id)
