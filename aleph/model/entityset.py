import logging
from enum import Enum
from datetime import datetime
from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB
from banal import ensure_list

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.common import SoftDeleteModel
from aleph.model.common import ENTITY_ID_LEN, make_textid

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


class EntitySet(db.Model, SoftDeleteModel):
    __tablename__ = "entityset"

    # set types
    GENERIC = "generic"
    DIAGRAM = "diagram"
    TIMELINE = "timeline"
    PROFILE = "profile"

    TYPES = frozenset([GENERIC, DIAGRAM, TIMELINE, PROFILE])

    id = db.Column(db.String(ENTITY_ID_LEN), primary_key=True)
    label = db.Column(db.Unicode)
    type = db.Column(db.String(10), index=True, default=GENERIC)
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
        entityset.update(data, collection)
        return entityset

    @classmethod
    def by_authz(cls, authz, types=None):
        ids = authz.collections(authz.READ)
        q = cls.by_type(types)
        q = q.filter(cls.collection_id.in_(ids))
        return q

    @classmethod
    def by_type(cls, types):
        """Retuns EntitySets of a particular type"""
        q = EntitySet.all()
        if types is not None:
            types = ensure_list(types)
            if not cls.TYPES.issuperset(types):
                raise TypeError(f"Invalid value for types: {types}")
            elif types != cls.TYPES:
                q = q.filter(EntitySet.type.in_(types))
        return q

    @classmethod
    def by_collection_id(cls, collection_id, types=None):
        """Retuns EntitySets within a given collection_id
        """
        q = cls.by_type(types)
        q = q.filter(EntitySet.collection_id == collection_id)
        return q

    @classmethod
    def by_entity_id(cls, entity_id, collection_id=None, judgements=None, types=None):
        """Retuns EntitySets that include EntitySetItems with the provided entity_id.

        NOTE: This only considers EntitySetItems who haven't been deleted
        """
        q = cls.by_type(types)
        q = q.join(EntitySetItem)
        q = q.filter(EntitySetItem.deleted_at == None)  # NOQA
        q = q.filter(EntitySetItem.entity_id == entity_id)
        if collection_id is not None:
            q = q.filter(EntitySet.collection_id == collection_id)
        if judgements is not None:
            q = q.filter(EntitySetItem.judgement.in_(ensure_list(judgements)))
        return q

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at):
        EntitySetItem.delete_by_collection(collection_id)

        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at}, synchronize_session=False)

    def items(self, deleted=False):
        q = EntitySetItem.all(deleted=deleted)
        q = q.filter(EntitySetItem.entityset_id == self.id)
        return q

    def profile(self, judgements=None, deleted=False):
        q = self.items(deleted=deleted)
        if judgements is not None:
            q = q.filter(EntitySetItem.judgement.in_(judgements))
        return q

    def take_items_from(self, other):
        """Moves EntitySetItems belonging to other EntitySet into this EntitySet

        The other EntitySet will not be deleted, however it won't have any items
        """
        pq = db.session.query(EntitySetItem)
        pq = pq.filter(EntitySetItem.entityset_id == other.id)
        pq = pq.filter(EntitySetItem.deleted_at == None)  # noqa
        return pq.update({EntitySetItem.entityset_id: self.id})

    def update(self, data, collection):
        self.label = data.get("label", self.label)
        self.type = data.get("type", self.type)
        self.summary = data.get("summary", self.summary)
        self.layout = data.get("layout", self.layout)
        self.updated_at = datetime.utcnow()
        self.deleted_at = None
        db.session.add(self)
        self.update_entities(data.get("entities", []))

    def update_entities(self, entities):
        """Update entities to the current EntitySet. Will delete EntitySetItems
        not in the provided entities list
        """
        q = EntitySetItem.all(deleted=True)
        q = q.filter(EntitySetItem.entityset_id == self.id)
        existing_items = {item.entity_id: item for item in q}

        for entity_id in entities:
            if entity_id in existing_items:
                item = existing_items.pop(entity_id)
                item.deleted_at = None
            else:
                item = EntitySetItem()
                item.created_at = self.updated_at
            item.added_by_id = self.role_id
            item.collection_id = self.collection_id
            item.entityset_id = self.id
            item.entity_id = entity_id
            item.judgement = Judgement.POSITIVE
            item.updated_at = self.updated_at
            db.session.add(item)

        # Now we delete any existing EntitySetItems that haven't been
        # referenced in entities and removed from the existing_items dict
        for item in existing_items.values():
            if item.deleted_at is None:
                item.delete()

    def delete(self, deleted_at=None):
        pq = db.session.query(EntitySetItem)
        pq = pq.filter(EntitySetItem.entityset_id == self.id)
        pq = pq.filter(EntitySetItem.deleted_at == None)  # noqa
        pq.update({EntitySetItem.deleted_at: deleted_at}, synchronize_session=False)

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
                "entities": self.entities,
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
    def create(cls, *, judgement=None, **data):
        if judgement is not None:
            judgement = Judgement(judgement)
        return cls(judgement=judgement, **data)

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

    def to_dict(self):
        data = self.to_dict_dates()
        data.update(
            {
                "id": stringify(self.id),
                "entityset_id": self.entityset_id,
                "entity_id": self.entity_id,
                "collection_id": self.collection_id,
                "added_by_id": self.added_by_id,
                "judgement": getattr(self.judgement, "name", None),
                "compared_to_entity_id": self.compared_to_entity_id,
            }
        )
        return data

    def __repr__(self):
        return "<EntitySetItem(%r, %r)>" % (self.entityset_id, self.entity_id)
