import logging
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import aliased
# from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.text import normalize_strong
from aleph.model.collection import Collection
from aleph.model.schema_model import SchemaModel
from aleph.model.common import SoftDeleteModel, UuidModel, make_textid
from aleph.model.entity_details import EntityOtherName, EntityIdentifier  # noqa
from aleph.model.entity_details import EntityAddress, EntityContactDetail  # noqa

log = logging.getLogger(__name__)

collection_entity_table = db.Table('collection_entity',
    db.Column('entity_id', db.String(32), db.ForeignKey('entity.id')),  # noqa
    db.Column('collection_id', db.Integer, db.ForeignKey('collection.id'))  # noqa
)


class Entity(db.Model, UuidModel, SoftDeleteModel, SchemaModel):
    _schema = '/entity/entity.json#'
    _schema_recurse = True

    STATE_ACTIVE = 'active'
    STATE_PENDING = 'pending'
    STATE_DELETED = 'deleted'

    name = db.Column(db.Unicode)
    type = db.Column('type', db.String(255), index=True)
    state = db.Column(db.String(128), nullable=True,
                      default=STATE_ACTIVE)
    summary = db.Column(db.Unicode, nullable=True)
    description = db.Column(db.Unicode, nullable=True)
    jurisdiction_code = db.Column(db.Unicode, nullable=True)
    register_name = db.Column(db.Unicode, nullable=True)
    register_url = db.Column(db.Unicode, nullable=True)

    __mapper_args__ = {
        'polymorphic_on': type,
        'polymorphic_identity': _schema
    }

    collections = db.relationship(Collection, secondary=collection_entity_table,  # noqa
                                  backref=db.backref('entities', lazy='dynamic'))  # noqa

    def delete(self, deleted_at=None):
        from aleph.model import Reference
        q = db.session.query(Reference)
        q = q.filter(Reference.entity_id == self.id)
        q.delete(synchronize_session='fetch')

        deleted_at = deleted_at or datetime.utcnow()
        for alert in self.alerts:
            alert.delete(deleted_at=deleted_at)
        self.state = self.STATE_DELETED
        super(Entity, self).delete(deleted_at=deleted_at)

    def update(self, data, merge=False):
        self.schema_update(data, merge=merge)

    def merge(self, other):
        if self.id == other.id:
            return

        # De-dupe todo:
        # 1. merge identifiers
        # 2. merge properties
        # 3. merge names, make merged names into a.k.a's
        # 4. merge collections
        # 5. update references
        # 6. update alerts
        # 7. delete source entities
        # 8. update source entities
        # 9. update target entity

        collections = list(self.collections)
        for collection in other.collections:
            if collection not in collections:
                self.collections.append(collection)

        if self.name.lower() != other.name.lower():
            aka = EntityOtherName()
            aka.update({'name': other.name})
            aka.entity = self
            db.session.add(aka)

        from aleph.model.alert import Alert
        q = db.session.query(Alert).filter(Alert.entity_id == other.id)
        q.update({'entity_id': self.id})

        from aleph.model.reference import Reference
        q = db.session.query(Reference).filter(Reference.entity_id == other.id)
        q.update({'entity_id': self.id})
        db.session.commit()

        db.session.refresh(other)
        self.schema_merge(other)

    def schema_merge(self, other):
        """Attempt to merge other onto self via JSON schema."""
        # TODO: figure out if we want to change schema
        for prop in self.schema_visitor.properties:
            if prop.name == 'id':
                continue

            self_value = getattr(self, prop.name) if \
                hasattr(self, prop.name) else None
            other_value = getattr(other, prop.name) if \
                hasattr(other, prop.name) else None

            if self_value is None and other_value is None:
                continue

            if prop.is_value and self_value is None:
                # update local properties
                setattr(self, prop.name, other_value)

            elif prop.is_object and self._schema_recurse:
                # update associated objects which are not set on the
                # existing object.
                rel = self._get_relationship(prop.name, 'MANYTOONE')
                if self_value is not None or other_value is None:
                    continue
                data = other_value.to_dict()
                obj = type(other_value)()
                obj.update(data)
                for local, remote in self._get_associations(obj, rel):
                    other_id = getattr(obj, remote)
                    setattr(self, local, other_id)

            elif prop.is_array and self._schema_recurse \
                    and other_value is not None:
                # merge array associations
                rel = self._get_relationship(prop.name, 'ONETOMANY')
                full_list = list(self_value)

                for new_item in other_value:
                    data = new_item.to_dict()
                    existing = [o for o in full_list if o.merge_compare(data)]
                    if len(existing):
                        continue

                    obj = type(new_item)()
                    obj.update(data)
                    for local, remote in self._get_associations(obj, rel):
                        setattr(obj, remote, getattr(self, local))
                    db.session.add(obj)
                    full_list.append(obj)

        self.created_at = min((self.created_at, other.created_at))
        self.updated_at = datetime.utcnow()
        other.delete()
        db.session.flush()

    @classmethod
    def save(cls, data, merge=False):
        ent = cls.by_id(data.get('id'))
        if 'state' not in data:
            data['state'] = cls.STATE_ACTIVE

        collections = data.pop('collections', [])
        for identifier in data.get('identifiers', []):
            if ent is None:
                ent = cls.by_identifier(identifier.get('scheme'),
                                        identifier.get('identifier'),
                                        collections=collections)
        if ent is None:
            schema = data.get('$schema', cls._schema)
            cls = cls.get_schema_class(schema)
            ent = cls()
            ent.id = make_textid()

        if merge:
            for collection in ent.collections:
                if collection.id not in [c.id for c in collections]:
                    collections.append(collection)
        if not len(collections):
            raise AttributeError("No collection specified.")

        ent.collections = collections
        ent.update(data, merge=merge)
        return ent

    @classmethod
    def filter_collections(cls, q, collections=None):
        if collections is None:
            return q
        collection_ids = []
        for collection in collections:
            if isinstance(collection, Collection):
                collection = collection.id
            collection_ids.append(collection)
        coll = aliased(Collection)
        q = q.join(coll, Entity.collections)
        q = q.filter(coll.id.in_(collection_ids))
        q = q.filter(coll.deleted_at == None)  # noqa
        return q

    @classmethod
    def by_identifier(cls, scheme, identifier, collections=None):
        q = db.session.query(Entity)
        q = q.filter(Entity.deleted_at == None)  # noqa
        q = cls.filter_collections(q, collections=collections)
        ident = aliased(EntityIdentifier)
        q = q.join(ident, Entity.identifiers)
        q = q.filter(ident.deleted_at == None) # noqa
        q = q.filter(ident.scheme == scheme)
        q = q.filter(ident.identifier == identifier)
        return q.first()

    @classmethod
    def by_id_set(cls, ids, collections=None):
        if not len(ids):
            return {}
        q = cls.all()
        q = cls.filter_collections(q, collections=collections)
        q = q.filter(cls.id.in_(ids))
        entities = {}
        for ent in q:
            entities[ent.id] = ent
        return entities

    @classmethod
    def latest(cls):
        q = db.session.query(func.max(cls.updated_at))
        q = q.filter(cls.state == cls.STATE_ACTIVE)
        return q.scalar()

    @property
    def terms(self):
        terms = set([self.name])
        for other_name in self.other_names:
            terms.update(other_name.terms)
        return [t for t in terms if t is not None and len(t)]

    @property
    def regex_terms(self):
        # This is to find the shortest possible regex for each entity.
        # If, for example, and entity matches both "Al Qaeda" and
        # "Al Qaeda in Iraq, Syria and the Levant", it is useless to
        # search for the latter.
        terms = [' %s ' % normalize_strong(t) for t in self.terms]
        regex_terms = set()
        for term in terms:
            if len(term) < 4 or len(term) > 120:
                continue
            contained = False
            for other in terms:
                if other == term:
                    continue
                if other in term:
                    contained = True
            if not contained:
                regex_terms.add(term.strip())
        return regex_terms

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.name)

    def __unicode__(self):
        return self.name

    def to_dict(self):
        data = super(Entity, self).to_dict()
        data['collections'] = [c.id for c in self.collections]
        return data


class EntityAsset(Entity):
    _schema = 'entity/asset.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    valuation = db.Column(db.Integer, nullable=True)
    valuation_currency = db.Column(db.Unicode(100), nullable=True)
    valuation_date = db.Column(db.Unicode, nullable=True)


class EntityLegalPerson(Entity):
    _schema = 'entity/legal_person.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    image = db.Column(db.Unicode, nullable=True)
    postal_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
    postal_address = db.relationship('EntityAddress',
                                     primaryjoin="and_(EntityAddress.id == foreign(EntityLegalPerson.postal_address_id), "  # noqa
                                                 "EntityAddress.deleted_at == None)")  # noqa


class EntityLand(EntityAsset):
    _schema = '/entity/land.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    parcel_number = db.Column(db.Unicode, nullable=True)
    parcel_name = db.Column(db.Unicode, nullable=True)
    parcel_area = db.Column(db.Integer, nullable=True)
    parcel_area_units = db.Column(db.Unicode, nullable=True)
    usage_code = db.Column(db.Unicode, nullable=True)
    usage_name = db.Column(db.Unicode, nullable=True)


class EntityBuilding(EntityAsset):
    _schema = '/entity/building.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    building_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
    building_address = db.relationship('EntityAddress',
                                       primaryjoin="and_(EntityAddress.id == foreign(EntityBuilding.building_address_id), "  # noqa
                                                   "EntityAddress.deleted_at == None)")  # noqa


class EntityPerson(EntityLegalPerson):
    _schema = '/entity/person.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    gender = db.Column(db.Unicode, nullable=True)
    birth_date = db.Column(db.Unicode, nullable=True)
    death_date = db.Column(db.Unicode, nullable=True)

    residential_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
    residential_address = db.relationship('EntityAddress',
                                          primaryjoin="and_(EntityAddress.id == foreign(EntityPerson.residential_address_id), "  # noqa
                                                      "EntityAddress.deleted_at == None)")  # noqa


class EntityOrganization(EntityLegalPerson):
    _schema = '/entity/organization.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    classification = db.Column(db.Unicode, nullable=True)
    founding_date = db.Column(db.Unicode, nullable=True)
    dissolution_date = db.Column(db.Unicode, nullable=True)
    current_status = db.Column(db.Unicode, nullable=True)

    registered_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
    registered_address = db.relationship('EntityAddress',
                                         primaryjoin="and_(EntityAddress.id == foreign(EntityOrganization.registered_address_id), "  # noqa
                                                     "EntityAddress.deleted_at == None)")  # noqa

    headquarters_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
    headquarters_address = db.relationship('EntityAddress',
                                           primaryjoin="and_(EntityAddress.id == foreign(EntityOrganization.headquarters_address_id), "  # noqa
                                                       "EntityAddress.deleted_at == None)")  # noqa


class EntityCompany(EntityOrganization):
    _schema = '/entity/company.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    company_number = db.Column(db.Unicode, nullable=True)
    sector = db.Column(db.Unicode, nullable=True)
    company_type = db.Column(db.Unicode, nullable=True)
