import logging
from datetime import datetime
from flask_babel import gettext
from sqlalchemy import or_
from sqlalchemy.dialects.postgresql import JSONB
from followthemoney import model
from followthemoney.types import registry
from followthemoney.exc import InvalidData

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
    schema = db.Column(db.String(255), index=True)
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

    def undelete(self):
        self.deleted_at = None
        db.session.add(self)

    def update(self, data, collection, validate=True):
        proxy = model.get_proxy(data, cleaned=False)
        if validate:
            # This isn't strictly required because the proxy will contain
            # only those values that can be inserted for each property,
            # making it valid -- all this does, therefore, is to raise an
            # exception that notifies the user.
            proxy.schema.validate(data)
        proxy = collection.ns.apply(proxy)
        self.id = collection.ns.sign(self.id)
        self.schema = proxy.schema.name
        previous = self.to_proxy()
        for prop in proxy.iterprops():
            # Do not allow the user to overwrite hashes because this could
            # lead to a user accessing random objects.
            if prop.type == registry.checksum:
                prev = previous.get(prop)
                proxy.set(prop, prev, cleaned=True, quiet=True)
        self.data = proxy.properties
        self.updated_at = datetime.utcnow()
        self.deleted_at = None
        db.session.add(self)

    def to_proxy(self):
        proxy = model.get_proxy({
            'id': self.id,
            'schema': self.schema,
            'properties': self.data
        })
        proxy.set('indexUpdatedAt', self.updated_at, quiet=True)
        return proxy

    @classmethod
    def create(cls, data, collection, validate=True):
        entity = cls()
        entity_id = data.get('id') or make_textid()
        if not registry.entity.validate(entity_id):
            raise InvalidData(gettext("Invalid entity ID"))
        entity.id = collection.ns.sign(entity_id)
        entity.collection_id = collection.id
        entity.update(data, collection, validate=validate)
        return entity

    @classmethod
    def by_id(cls, entity_id, collection=None, deleted=False):
        q = cls.all(deleted=deleted)
        q = q.filter(cls.id == entity_id)
        if collection is not None:
            q = q.filter(cls.collection_id == collection.id)
        return q.first()

    @classmethod
    def by_collection(cls, collection_id):
        return cls.all().filter(Entity.collection_id == collection_id)

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

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.schema)
