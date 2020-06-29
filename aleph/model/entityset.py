import logging
from datetime import datetime
from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.common import SoftDeleteModel
from aleph.model.common import make_textid, ENTITY_ID_LEN

log = logging.getLogger(__name__)


class EntitySet(db.Model, SoftDeleteModel):
    __tablename__ = 'set'

    id = db.Column(db.String(ENTITY_ID_LEN), primary_key=True)
    label = db.Column(db.Unicode)
    summary = db.Column(db.Unicode, nullable=True)
    layout = db.Column('layout', JSONB)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role)

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection)

    def update(self, data, collection):
        self.updated_at = datetime.utcnow()
        self.deleted_at = None
        self.label = data.get('label', self.label)
        self.summary = data.get('summary', self.summary)
        self.layout = data.get('layout', self.layout)
        entities = []
        for entity_id in self.entities:
            entities.append(collection.ns.sign(entity_id))
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
    def delete_by_collection(cls, collection_id, deleted_at=None):
        deleted_at = deleted_at or datetime.utcnow()
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at},
                  synchronize_session=False)

    @classmethod
    def create(cls, data,  collection, role_id):
        eset = cls()
        eset.layout = {}
        eset.role_id = role_id
        eset.collection_id = collection.id
        eset.update(data, collection)
        return eset

    def __repr__(self):
        return '<EntitySet(%r, %r)>' % (self.id, self.collection_id)


class EntitySetItem(db.Model, SoftDeleteModel):
    __tablename__ = 'set_item'

    set_id = db.Column(db.String(ENTITY_ID_LEN), db.ForeignKey('entity_set.id'), index=True)  # noqa
    entity_id = db.Column(db.String(ENTITY_ID_LEN), index=True)
    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa

    def __repr__(self):
        return '<EntitySetItem(%r, %r)>' % (self.set_id, self.entity_id)
