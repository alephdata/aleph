import logging
from datetime import datetime
from normality import stringify
from followthemoney import model
from sqlalchemy import or_
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.collection import Collection
from aleph.model.match import Match
from aleph.model.common import SoftDeleteModel
from aleph.model.common import make_textid, ENTITY_ID_LEN

log = logging.getLogger(__name__)


class Entity(db.Model, SoftDeleteModel):
    THING = 'Thing'
    LEGAL_ENTITY = 'LegalEntity'

    id = db.Column(db.String(ENTITY_ID_LEN), primary_key=True,
                   default=make_textid, nullable=False, unique=False)
    name = db.Column(db.Unicode)
    schema = db.Column(db.String(255), index=True)
    foreign_id = db.Column(db.Unicode)
    data = db.Column('data', JSONB)

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('entities', lazy='dynamic'))  # noqa

    @property
    def model(self):
        return model.get(self.schema)

    def delete_matches(self):
        pq = db.session.query(Match)
        pq = pq.filter(or_(
            Match.entity_id == self.id,
            Match.match_id == self.id
        ))
        pq.delete(synchronize_session=False)
        db.session.refresh(self)

    def delete(self, deleted_at=None):
        self.delete_matches()
        deleted_at = deleted_at or datetime.utcnow()
        super(Entity, self).delete(deleted_at=deleted_at)

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at=None):
        deleted_at = deleted_at or datetime.utcnow()

        entities = db.session.query(cls.id)
        entities = entities.filter(cls.collection_id == collection_id)
        entities = entities.subquery()

        pq = db.session.query(Match)
        pq = pq.filter(Match.entity_id.in_(entities))
        pq.delete(synchronize_session=False)

        pq = db.session.query(Match)
        pq = pq.filter(Match.match_id.in_(entities))
        pq.delete(synchronize_session=False)

        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at},
                  synchronize_session=False)

    def merge(self, other):
        if self.id == other.id:
            raise ValueError("Cannot merge an entity with itself.")
        if self.collection_id != other.collection_id:
            raise ValueError("Cannot merge entities from different collections.")  # noqa

        proxy = self.to_proxy()
        other_proxy = other.to_proxy()
        proxy.merge(other_proxy)
        if proxy.caption != other_proxy.caption:
            proxy.add('alias', other_proxy.caption)
        self.apply_proxy(proxy)
        self.created_at = min((self.created_at, other.created_at))
        self.updated_at = datetime.utcnow()

        # delete source entities
        other.delete()
        db.session.add(self)
        db.session.commit()
        db.session.refresh(other)

    def update(self, entity):
        proxy = model.get_proxy(entity)
        proxy.schema.validate(entity)
        self.apply_proxy(proxy)
        self.updated_at = datetime.utcnow()
        db.session.add(self)

    def apply_proxy(self, proxy):
        self.schema = proxy.schema.name
        self.name = proxy.caption
        self.data = proxy.properties

    def to_proxy(self):
        proxy = model.get_proxy({
            'id': self.id,
            'schema': self.schema,
            'properties': self.data
        })
        proxy.add('name', self.name)
        proxy.set('indexUpdatedAt', self.created_at)
        return proxy

    def to_dict(self):
        proxy = self.to_proxy()
        data = proxy.to_full_dict()
        data.update(self.to_dict_dates())
        data.update({
            'foreign_id': self.foreign_id,
            'collection_id': stringify(self.collection_id),
        })
        return data

    @classmethod
    def create(cls, data, collection):
        foreign_id = data.get('foreign_id')
        ent = cls.by_foreign_id(foreign_id, collection.id, deleted=True)
        if ent is None:
            ent = cls()
            ent.id = make_textid()
            ent.collection = collection
            ent.foreign_id = foreign_id
        ent.deleted_at = None
        ent.update(data)
        return ent

    @classmethod
    def by_foreign_id(cls, foreign_id, collection_id, deleted=False):
        if foreign_id is None:
            return None
        q = cls.all(deleted=deleted)
        q = q.filter(Entity.collection_id == collection_id)
        q = q.filter(cls.foreign_id == foreign_id)
        q = q.order_by(Entity.deleted_at.desc().nullsfirst())
        return q.first()

    @classmethod
    def by_collection(cls, collection_id):
        return cls.all().filter(Entity.collection_id == collection_id)

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.name)
