import logging
from banal import is_mapping, ensure_list
from datetime import datetime
from followthemoney import model
from followthemoney.util import merge_data
from sqlalchemy import or_
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.collection import Collection
from aleph.model.permission import Permission
from aleph.model.match import Match
from aleph.model.common import SoftDeleteModel, UuidModel
from aleph.model.common import make_textid

log = logging.getLogger(__name__)


class Entity(db.Model, UuidModel, SoftDeleteModel):
    THING = 'Thing'

    name = db.Column(db.Unicode)
    schema = db.Column(db.String(255), index=True)
    foreign_id = db.Column(db.Unicode)
    data = db.Column('data', JSONB)

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('entities', lazy='dynamic'))  # noqa

    @property
    def model(self):
        return model.get(self.schema)

    @property
    def names(self):
        names = set([self.name])
        for name, prop in self.model.properties.items():
            if prop.type_name not in ['name']:
                continue
            names.update(ensure_list(self.data.get(name)))
        return names

    def delete_matches(self):
        pq = db.session.query(Match)
        pq = pq.filter(or_(
            Match.entity_id == self.id,
            Match.match_id == self.id))
        pq.delete(synchronize_session=False)
        db.session.refresh(self)

    def delete(self, deleted_at=None):
        self.delete_matches()
        deleted_at = deleted_at or datetime.utcnow()
        for alert in self.alerts:
            alert.delete(deleted_at=deleted_at)
        super(Entity, self).delete(deleted_at=deleted_at)

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at=None):
        from aleph.model import Alert
        deleted_at = deleted_at or datetime.utcnow()

        entities = db.session.query(cls.id)
        entities = entities.filter(cls.collection_id == collection_id)
        entities = entities.subquery()

        pq = db.session.query(Alert)
        pq = pq.filter(Alert.entity_id.in_(entities))
        pq.update({Alert.deleted_at: deleted_at},
                  synchronize_session=False)

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

        self.schema = model.precise_schema(self.schema, other.schema)
        self.created_at = min((self.created_at, other.created_at))
        self.updated_at = datetime.utcnow()

        data = merge_data(self.data, other.data)
        if self.name != other.name:
            data = merge_data(data, {'alias': [other.name]})
        self.data = data

        # update alerts
        from aleph.model.alert import Alert
        q = db.session.query(Alert).filter(Alert.entity_id == other.id)
        q.update({Alert.entity_id: self.id})

        # delete source entities
        other.delete()
        db.session.add(self)
        db.session.commit()
        db.session.refresh(other)

    def update(self, entity):
        self.schema = entity.get('schema')

        data = entity.get('properties')
        if is_mapping(data):
            data['name'] = [entity.get('name')]
            self.data = self.model.validate(data)
        elif self.data is None:
            self.data = {}

        self.data.pop('name', None)
        self.name = entity.get('name')

        # TODO: should this be mutable?
        # self.foreign_id = entity.get('foreign_id')
        self.updated_at = datetime.utcnow()
        db.session.add(self)

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
    def all_ids(cls, deleted=False, authz=None):
        q = super(Entity, cls).all_ids(deleted=deleted)
        if authz is not None and not authz.is_admin:
            q = q.join(Permission,
                       cls.collection_id == Permission.collection_id)
            q = q.filter(Permission.deleted_at == None)  # noqa
            q = q.filter(Permission.read == True)  # noqa
            q = q.filter(Permission.role_id.in_(authz.roles))
        return q

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.name)
