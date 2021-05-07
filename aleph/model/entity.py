import logging
from datetime import datetime
from flask_babel import gettext
from sqlalchemy.dialects.postgresql import JSONB
from followthemoney import model
from followthemoney.types import registry
from followthemoney.exc import InvalidData

from aleph.core import db
from aleph.model.collection import Collection
from aleph.model.common import DatedModel
from aleph.model.common import iso_text, make_textid, ENTITY_ID_LEN

log = logging.getLogger(__name__)


class Entity(db.Model, DatedModel):
    THING = "Thing"
    LEGAL_ENTITY = "LegalEntity"
    ANALYZABLE = "Analyzable"

    id = db.Column(
        db.String(ENTITY_ID_LEN),
        primary_key=True,
        default=make_textid,
        nullable=False,
        unique=False,
    )
    schema = db.Column(db.String(255), index=True)
    data = db.Column("data", JSONB)

    role_id = db.Column(db.Integer, db.ForeignKey("role.id"), nullable=True)  # noqa
    collection_id = db.Column(db.Integer, db.ForeignKey("collection.id"), index=True)
    collection = db.relationship(
        Collection, backref=db.backref("entities", lazy="dynamic")
    )

    @property
    def model(self):
        return model.get(self.schema)

    def update(self, data, collection, sign=True):
        proxy = model.get_proxy(data, cleaned=False)
        if sign:
            proxy = collection.ns.apply(proxy)
        self.schema = proxy.schema.name
        previous = self.to_proxy()
        for prop in proxy.schema.properties.values():
            # Do not allow the user to overwrite hashes because this could
            # lead to a user accessing random objects.
            if prop.type == registry.checksum:
                prev = previous.get(prop)
                proxy.set(prop, prev, cleaned=True, quiet=True)
        self.data = proxy.properties
        self.updated_at = datetime.utcnow()
        db.session.add(self)

    def to_proxy(self):
        data = {
            "id": self.id,
            "schema": self.schema,
            "properties": self.data,
            "created_at": iso_text(self.created_at),
            "updated_at": iso_text(self.updated_at),
            "role_id": self.role_id,
            "mutable": True,
        }
        return model.get_proxy(data, cleaned=False)

    @classmethod
    def create(cls, data, collection, sign=True, role_id=None):
        entity = cls()
        entity_id = data.get("id") or make_textid()
        if not registry.entity.validate(entity_id):
            raise InvalidData(gettext("Invalid entity ID"))
        entity.id = collection.ns.sign(entity_id)
        entity.collection_id = collection.id
        entity.role_id = role_id
        entity.update(data, collection, sign=sign)
        return entity

    @classmethod
    def by_id(cls, entity_id, collection=None):
        q = cls.all().filter(cls.id == entity_id)
        if collection is not None:
            q = q.filter(cls.collection_id == collection.id)
        return q.first()

    @classmethod
    def by_collection(cls, collection_id):
        q = cls.all()
        q = q.filter(Entity.collection_id == collection_id)
        q = q.yield_per(5000)
        return q

    @classmethod
    def delete_by_collection(cls, collection_id):
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq.delete(synchronize_session=False)

    def __repr__(self):
        return "<Entity(%r, %r)>" % (self.id, self.schema)
