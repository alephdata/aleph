import logging
from banal import is_mapping
from datetime import datetime
from normality import stringify
from followthemoney import model
from sqlalchemy import func, or_
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from followthemoney.util import merge_data

from aleph.core import db
from aleph.text import match_form
from aleph.util import ensure_list
from aleph.model.collection import Collection
from aleph.model.permission import Permission
from aleph.model.match import Match
from aleph.model.common import SoftDeleteModel, UuidModel
from aleph.model.common import make_textid

log = logging.getLogger(__name__)


class Entity(db.Model, UuidModel, SoftDeleteModel):
    name = db.Column(db.Unicode)
    type = db.Column(db.String(255), index=True)
    foreign_ids = db.Column(ARRAY(db.Unicode()))
    data = db.Column('data', JSONB)

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('entities', lazy='dynamic'))  # noqa

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

        data = merge_data(self.data, other.data)
        if self.name.lower() != other.name.lower():
            data = merge_data(data, {'alias': [other.name]})

        self.type = model.precise_schema(self.type, other.type)
        self.data = data
        self.foreign_ids = self.foreign_ids or []
        self.foreign_ids += other.foreign_ids or []
        self.created_at = min((self.created_at, other.created_at))
        self.updated_at = datetime.utcnow()

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
        data = entity.get('properties')
        if is_mapping(data):
            data['name'] = [entity.get('name')]
            self.data = self.schema.validate(data)
        elif self.data is None:
            self.data = {}

        self.data.pop('name', None)
        self.name = entity.get('name')

        fid = [stringify(f) for f in entity.get('foreign_ids') or []]
        self.foreign_ids = list(set([f for f in fid if f is not None]))
        self.updated_at = datetime.utcnow()
        db.session.add(self)

    @classmethod
    def create(cls, data, collection):
        ent = cls()
        ent.type = data.pop('schema', None)
        ent.id = make_textid()
        ent.collection = collection
        ent.update(data)
        return ent

    @classmethod
    def by_foreign_id(cls, foreign_id, collection_id, deleted=False):
        foreign_id = stringify(foreign_id)
        if foreign_id is None:
            return None
        q = cls.all(deleted=deleted)
        q = q.filter(Entity.collection_id == collection_id)
        foreign_id = func.cast([foreign_id], ARRAY(db.Unicode()))
        q = q.filter(cls.foreign_ids.contains(foreign_id))
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

    @classmethod
    def latest(cls):
        q = db.session.query(func.max(cls.updated_at))
        q = q.filter(cls.deleted_at == None)  # noqa
        return q.scalar()

    @property
    def schema(self):
        return model.get(self.type)

    @property
    def terms(self):
        terms = set([self.name])
        for alias in ensure_list(self.data.get('alias')):
            if alias is not None and len(alias):
                terms.add(alias)
        return terms

    @property
    def regex_terms(self):
        # This is to find the shortest possible regex for each entity.
        # If, for example, and entity matches both "Al Qaeda" and
        # "Al Qaeda in Iraq, Syria and the Levant", it is useless to
        # search for the latter.
        terms = set([match_form(t) for t in self.terms])
        regex_terms = set()
        for term in terms:
            if term is None or len(term) < 4 or len(term) > 120:
                continue
            contained = False
            for other in terms:
                if other is None or other == term:
                    continue
                if other in term:
                    contained = True
            if not contained:
                regex_terms.add(term)
        return regex_terms

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.name)
