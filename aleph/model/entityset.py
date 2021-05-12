import logging
from enum import Enum
from datetime import datetime
from normality import stringify
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB
from banal import ensure_list

from aleph.core import db
from aleph.model import Role, Collection, Permission
from aleph.model.common import SoftDeleteModel
from aleph.model.common import ENTITY_ID_LEN, make_textid, query_like

log = logging.getLogger(__name__)


class Judgement(Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    UNSURE = "unsure"
    NO_JUDGEMENT = "no_judgement"

    def __add__(self, other):
        if self == other:
            return self
        if Judgement.NEGATIVE in (self, other):
            return Judgement.NEGATIVE
        return Judgement.UNSURE

    def to_dict(self):
        return str(self.value)


class EntitySet(db.Model, SoftDeleteModel):
    __tablename__ = "entityset"

    # set types
    LIST = "list"
    DIAGRAM = "diagram"
    TIMELINE = "timeline"
    PROFILE = "profile"

    TYPES = frozenset([LIST, DIAGRAM, TIMELINE, PROFILE])

    id = db.Column(db.String(ENTITY_ID_LEN), primary_key=True)
    label = db.Column(db.Unicode)
    type = db.Column(db.String(10), index=True, default=LIST)
    summary = db.Column(db.Unicode, nullable=True)
    layout = db.Column("layout", JSONB, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey("role.id"), index=True)
    role = db.relationship(Role)

    collection_id = db.Column(db.Integer, db.ForeignKey("collection.id"), index=True)
    collection = db.relationship(Collection)

    parent_id = db.Column(db.String(ENTITY_ID_LEN), db.ForeignKey("entityset.id"))
    parent = db.relationship("EntitySet", backref="children", remote_side=[id])

    @property
    def entities(self):
        q = db.session.query(EntitySetItem.entity_id)
        q = q.filter(EntitySetItem.entityset_id == self.id)
        q = q.filter(EntitySetItem.judgement == Judgement.POSITIVE)
        q = q.filter(EntitySetItem.deleted_at == None)  # noqa
        return [entity_id for entity_id, in q.all()]

    @classmethod
    def create(cls, data, collection, authz):
        entityset = cls()
        entityset.id = make_textid()
        entityset.layout = {}
        entityset.role_id = authz.id
        entityset.collection_id = collection.id
        entityset.collection = collection
        entityset.created_at = datetime.utcnow()
        entityset.update(data)
        return entityset

    @classmethod
    def by_id(cls, entityset_id, types=None, deleted=False):
        q = cls.by_type(types, deleted=deleted)
        q = q.filter(cls.id == entityset_id)
        return q.first()

    @classmethod
    def by_authz(cls, authz, types=None, prefix=None):
        ids = authz.collections(authz.READ)
        q = cls.by_type(types)
        q = q.filter(cls.collection_id.in_(ids))
        if prefix is not None:
            q = q.filter(query_like(cls.label, prefix))
        return q

    @classmethod
    def by_type(cls, types, deleted=False):
        """Retuns EntitySets of a particular type"""
        q = EntitySet.all(deleted=deleted)
        types = ensure_list(types)
        if len(types) and types != cls.TYPES:
            q = q.filter(EntitySet.type.in_(types))
        return q

    @classmethod
    def by_collection_id(cls, collection_id, types=None):
        """Retuns EntitySets within a given collection_id"""
        q = cls.by_type(types)
        q = q.filter(EntitySet.collection_id == collection_id)
        return q

    @classmethod
    def by_entity_id(
        cls, entity_id, collection_ids=None, judgements=None, types=None, labels=None
    ):
        """Retuns EntitySets that include EntitySetItems with the provided entity_id.

        NOTE: This only considers EntitySetItems who haven't been deleted
        """
        q = cls.by_type(types)
        if labels is not None:
            q = q.filter(EntitySet.label.in_(ensure_list(labels)))
        q = q.join(EntitySetItem)
        q = q.filter(EntitySetItem.deleted_at == None)  # NOQA
        q = q.filter(EntitySetItem.entity_id == entity_id)
        if collection_ids:
            q = q.filter(EntitySet.collection_id.in_(collection_ids))
        if judgements is not None:
            q = q.filter(EntitySetItem.judgement.in_(ensure_list(judgements)))
        return q

    @classmethod
    def entity_entitysets(cls, entity_id, collection_id=None):
        """Retuns EntitySets linked positive to entity_id."""
        q = db.session.query(cls.id)
        q = q.join(EntitySetItem)
        q = q.filter(cls.deleted_at == None)  # NOQA
        q = q.filter(EntitySetItem.deleted_at == None)  # NOQA
        q = q.filter(EntitySetItem.entity_id == entity_id)
        q = q.filter(EntitySetItem.judgement == Judgement.POSITIVE)
        if collection_id:
            q = q.filter(EntitySetItem.collection_id == collection_id)
        return set([id_ for id_, in q.all()])

    @classmethod
    def all_profiles(cls, collection_id, entity_id=None):
        q = EntitySet.all_ids()
        q = q.filter(EntitySet.type == EntitySet.PROFILE)
        q = q.filter(EntitySet.collection_id == collection_id)
        q = q.join(EntitySetItem)
        q = q.filter(EntitySetItem.deleted_at == None)  # NOQA
        q = q.filter(EntitySetItem.judgement == Judgement.POSITIVE)
        q = q.filter(EntitySetItem.collection_id == collection_id)
        if entity_id is not None:
            q = q.filter(EntitySetItem.entity_id == entity_id)
        q = q.add_columns(EntitySetItem.entity_id)
        return q

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at):
        EntitySetItem.delete_by_collection(collection_id)

        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at}, synchronize_session=False)

    @classmethod
    def type_counts(cls, authz=None, collection_id=None):
        q = db.session.query(cls.type, func.count(cls.id))
        q = q.filter(cls.deleted_at == None)  # noqa
        if collection_id is not None:
            q = q.filter(cls.collection_id == collection_id)
        elif authz is not None and not authz.is_admin:
            q = q.join(Permission, cls.collection_id == Permission.collection_id)
            q = q.filter(Permission.read == True)  # noqa
            q = q.filter(Permission.role_id.in_(authz.roles))
        q = q.group_by(cls.type)
        return dict(q.all())

    def items(self, authz=None, deleted=False):
        q = EntitySetItem.all(deleted=deleted)
        if authz is not None:
            ids = authz.collections(authz.READ)
            q = q.filter(EntitySetItem.collection_id.in_(ids))
        q = q.filter(EntitySetItem.entityset_id == self.id)
        q = q.order_by(EntitySetItem.created_at.asc())
        return q

    def profile(self, judgements=None, deleted=False):
        q = self.items(deleted=deleted)
        if judgements is not None:
            q = q.filter(EntitySetItem.judgement.in_(judgements))
        return q

    def merge(self, other, merged_by_id):
        """Merge two entity_sets into each other. The older one is
        retained. This tries to retain a state where there is only
        one judgement between a set and an entity.
        """
        if other.id == self.id:
            return self
        if other.created_at > self.created_at:
            return other.merge(self, merged_by_id)

        local_items = {i.entity_id: i for i in self.items()}
        for remote in other.items():
            local = local_items.get(remote.entity_id)
            if local is None:
                remote.entityset_id = self.id
                remote.updated_at = datetime.utcnow()
                db.session.add(remote)
                continue
            judgement = local.judgement + remote.judgement
            if judgement == local.judgement:
                remote.delete()
                continue

            origin = local.compared_to_entity_id or remote.compared_to_entity_id
            combined = EntitySetItem(
                entityset_id=self.id,
                entity_id=local.entity_id,
                collection_id=local.collection_id,
                added_by_id=merged_by_id,
                judgement=judgement,
                compared_to_entity_id=origin,
            )
            db.session.add(combined)
            local.delete()
            remote.delete()
        other.delete()
        self.updated_at = datetime.utcnow()
        db.session.add(self)
        db.session.flush()
        return self

    def update(self, data):
        self.label = data.get("label", self.label)
        self.type = data.get("type", self.type)
        self.summary = data.get("summary", self.summary)
        self.layout = data.get("layout", self.layout)
        self.updated_at = datetime.utcnow()
        self.deleted_at = None
        self.collection.touch()
        db.session.add(self)

    def delete(self, deleted_at=None):
        pq = db.session.query(EntitySetItem)
        pq = pq.filter(EntitySetItem.entityset_id == self.id)
        pq = pq.filter(EntitySetItem.deleted_at == None)  # noqa
        pq.update({EntitySetItem.deleted_at: deleted_at}, synchronize_session=False)

        for mapping in self.mappings:
            mapping.entityset_id = None
            db.session.add(mapping)

        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)

    def to_dict(self):
        data = self.to_dict_dates()
        data.update(
            {
                "id": stringify(self.id),
                "type": self.type,
                "label": self.label,
                "summary": self.summary,
                "layout": self.layout,
                "role_id": stringify(self.role_id),
                "collection_id": stringify(self.collection_id),
            }
        )
        return data

    def __repr__(self):
        return "<EntitySet(%r, %r)>" % (self.id, self.collection_id)


class EntitySetItem(db.Model, SoftDeleteModel):
    __tablename__ = "entityset_item"

    id = db.Column(db.Integer, primary_key=True)
    entityset_id = db.Column(
        db.String(ENTITY_ID_LEN), db.ForeignKey("entityset.id"), index=True
    )
    entity_id = db.Column(db.String(ENTITY_ID_LEN), index=True)
    collection_id = db.Column(db.Integer, db.ForeignKey("collection.id"), index=True)

    compared_to_entity_id = db.Column(db.String(ENTITY_ID_LEN))
    added_by_id = db.Column(db.Integer, db.ForeignKey("role.id"))
    judgement = db.Column(db.Enum(Judgement))

    entityset = db.relationship(EntitySet)
    collection = db.relationship(Collection)
    added_by = db.relationship(Role)

    @classmethod
    def by_entity_id(cls, entityset, entity_id):
        q = cls.all()
        q = q.filter(cls.entityset_id == entityset.id)
        q = q.filter(cls.entity_id == entity_id)
        q = q.order_by(cls.created_at.desc())
        return q.first()

    @classmethod
    def save(cls, entityset, entity_id, judgement=None, collection_id=None, **data):
        if judgement is None:
            judgement = Judgement.POSITIVE
        else:
            judgement = Judgement(judgement)

        # Special case for profiles: an entity can only be part of one profile
        # in any given collection. An attempt to add it to a second profile must
        # result in a merging of both profiles.
        if entityset.type == EntitySet.PROFILE and judgement == Judgement.POSITIVE:
            for existing in EntitySet.by_entity_id(
                entity_id,
                collection_ids=[entityset.collection_id],
                judgements=[Judgement.POSITIVE],
                types=[EntitySet.PROFILE],
            ):
                entityset = entityset.merge(existing, entity_id)

        # Check if there is an existing relationship between the entity and the
        # entity set. If the judgement matches, no-op - otherwise delete the
        # previous relationship item.
        existing = cls.by_entity_id(entityset, entity_id)
        if existing is not None:
            if existing.judgement == judgement:
                return existing
            existing.delete()

        # There is no judgement information to be stored, so let's keep that out
        # of the database:
        if judgement == Judgement.NO_JUDGEMENT:
            return

        item = cls(
            entityset=entityset,
            entity_id=entity_id,
            judgement=judgement,
            compared_to_entity_id=data.get("compared_to_entity_id"),
            collection_id=collection_id or entityset.collection_id,
            added_by_id=data.get("added_by_id"),
        )
        db.session.add(item)
        return item

    @classmethod
    def delete_by_collection(cls, collection_id):
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq.delete(synchronize_session=False)

        pq = db.session.query(cls)
        pq = pq.filter(EntitySet.collection_id == collection_id)
        pq = pq.filter(EntitySet.id == cls.entityset_id)
        pq.delete(synchronize_session=False)

    @classmethod
    def delete_by_entity(cls, entity_id):
        pq = db.session.query(cls)
        pq = pq.filter(cls.entity_id == entity_id)
        pq.delete(synchronize_session=False)

    def to_dict(self, entityset=None):
        data = {
            "id": "$".join((self.entityset_id, self.entity_id)),
            "entity_id": self.entity_id,
            "collection_id": self.collection_id,
            "added_by_id": self.added_by_id,
            "judgement": self.judgement,
            "compared_to_entity_id": self.compared_to_entity_id,
        }
        entityset = entityset or self.entityset
        data["entityset_collection_id"] = entityset.collection_id
        data["entityset_id"] = entityset.id
        data.update(self.to_dict_dates())
        return data

    def __repr__(self):
        return "<EntitySetItem(%r, %r)>" % (self.entityset_id, self.entity_id)
