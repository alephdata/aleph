import logging
# from datetime import datetime
from sqlalchemy import or_
from sqlalchemy.orm import aliased
# from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.util import find_subclasses
from aleph.model.collection import Collection
from aleph.model.validation import SchemaModel
from aleph.model.common import SoftDeleteModel, IdModel
from aleph.model.entity_util import SchemaDispatcher
from aleph.model.entity_details import EntityOtherName, EntityIdentifier  # noqa
from aleph.model.entity_details import EntityAddress, EntityContactDetail  # noqa

log = logging.getLogger(__name__)


class Entity(db.Model, IdModel, SoftDeleteModel, SchemaModel,
             SchemaDispatcher):
    _schema = '/entity/entity.json#'

    name = db.Column(db.Unicode)
    type = db.Column('type', db.String(255), index=True)
    summary = db.Column(db.Unicode, nullable=True)
    description = db.Column(db.Unicode, nullable=True)
    jurisdiction_code = db.Column(db.Unicode, nullable=True)

    __mapper_args__ = {
        'polymorphic_on': type,
        'polymorphic_identity': _schema
    }

    collection_id = db.Column(db.Integer(), db.ForeignKey('collection.id'))
    collection = db.relationship(Collection, backref=db.backref('entities', lazy='dynamic', cascade='all, delete-orphan'))  # noqa

    def delete(self):
        from aleph.model import Reference
        q = db.session.query(Reference)
        q = q.filter(Reference.entity_id == self.id)
        q.delete(synchronize_session='fetch')
        super(Entity, self).delete()

    def update(self, data):
        self.schema_update(data)

    @classmethod
    def save(cls, data):
        ent = cls.by_id(data.get('id'))
        if ent is not None:
            ent.update(data)
            return ent
        else:
            schema = data.get('$schema', cls._schema)
            if schema != cls._schema:
                for subcls in find_subclasses(cls):
                    if subcls._schema == schema:
                        cls = subcls
            ent = cls()
            ent.collection_id = data.get('collection_id')
            ent.update(data)
            return ent

    @property
    def terms(self):
        terms = set([self.name])
        for other_name in self.other_names:
            terms.update(other_name.terms)
        return [t for t in terms if t is not None and len(t)]

    @classmethod
    def by_id_set(cls, ids, collection_id=None):
        if not len(ids):
            return {}
        q = cls.all()
        q = q.filter(cls.id.in_(ids))
        if collection_id is not None:
            q = q.filter(cls.collection_id == collection_id)
        entities = {}
        for ent in q:
            entities[ent.id] = ent
        return entities

    @classmethod
    def suggest_prefix(cls, prefix, collections, limit=10):
        if prefix is None or not len(prefix):
            return []
        prefix = prefix.strip()
        ent = aliased(Entity)
        q = db.session.query(ent.id, ent.name, ent.type)
        q = q.filter(ent.deleted_at == None)  # noqa
        q = q.filter(ent.collection_id.in_(collections))
        q = q.filter(or_(ent.name.ilike('%s%%' % prefix),
                         ent.name.ilike('%% %s%%' % prefix)))
        q = q.limit(limit)
        suggestions = []
        for entity_id, name, schema in q.all():
            suggestions.append({
                'id': entity_id,
                'name': name,
                'type': schema
            })
        return suggestions

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.name)

    def __unicode__(self):
        return self.name

    def to_dict(self):
        data = super(Entity, self).to_dict()
        data['collection_id'] = self.collection_id
        return data


class EntityAsset(Entity):
    _schema = 'entity/asset.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    register_name = db.Column(db.Unicode, nullable=True)
    valuation = db.Column(db.Integer, nullable=True)
    valuation_currency = db.Column(db.Unicode(100), nullable=True)
    valuation_date = db.Column(db.Date, nullable=True)


class EntityLegalPerson(Entity):
    _schema = 'entity/legal_person.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    image = db.Column(db.Unicode, nullable=True)
    postal_address_id = db.Column(db.Integer(), db.ForeignKey('entity_address.id'))  # noqa
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

    building_address_id = db.Column(db.Integer(), db.ForeignKey('entity_address.id'))  # noqa
    building_address = db.relationship('EntityAddress',
                                       primaryjoin="and_(EntityAddress.id == foreign(EntityBuilding.building_address_id), "  # noqa
                                                   "EntityAddress.deleted_at == None)")  # noqa


class EntityPerson(EntityLegalPerson):
    _schema = '/entity/person.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    gender = db.Column(db.Unicode, nullable=True)
    birth_date = db.Column(db.Date, nullable=True)
    death_date = db.Column(db.Date, nullable=True)
    biography = db.Column(db.Date, nullable=True)

    residential_address_id = db.Column(db.Integer(), db.ForeignKey('entity_address.id'))  # noqa
    residential_address = db.relationship('EntityAddress',
                                          primaryjoin="and_(EntityAddress.id == foreign(EntityPerson.residential_address_id), "  # noqa
                                                      "EntityAddress.deleted_at == None)")  # noqa


class EntityOrganization(EntityLegalPerson):
    _schema = '/entity/organization.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    classification = db.Column(db.Unicode, nullable=True)
    founding_date = db.Column(db.Date, nullable=True)
    dissolution_date = db.Column(db.Date, nullable=True)
    current_status = db.Column(db.Date, nullable=True)

    registered_address_id = db.Column(db.Integer(), db.ForeignKey('entity_address.id'))  # noqa
    registered_address = db.relationship('EntityAddress',
                                         primaryjoin="and_(EntityAddress.id == foreign(EntityOrganization.registered_address_id), "  # noqa
                                                     "EntityAddress.deleted_at == None)")  # noqa

    headquarters_address_id = db.Column(db.Integer(), db.ForeignKey('entity_address.id'))  # noqa
    headquarters_address = db.relationship('EntityAddress',
                                           primaryjoin="and_(EntityAddress.id == foreign(EntityOrganization.headquarters_address_id), "  # noqa
                                                       "EntityAddress.deleted_at == None)")  # noqa


class EntityCompany(EntityOrganization, EntityAsset):
    _schema = '/entity/company.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    company_number = db.Column(db.Unicode, nullable=True)
    sector = db.Column(db.Date, nullable=True)
    company_type = db.Column(db.Date, nullable=True)
    register_url = db.Column(db.Date, nullable=True)
