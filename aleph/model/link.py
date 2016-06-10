import logging

from aleph.core import db
from aleph.model.schema_model import SchemaModel
from aleph.model.common import SoftDeleteModel, IdModel, make_textid

log = logging.getLogger(__name__)


class Link(db.Model, IdModel, SoftDeleteModel, SchemaModel):
    _schema = '/link/link.json#'

    role = db.Column(db.Unicode)
    type = db.Column('type', db.String(255), index=True)
    role = db.Column(db.Unicode, nullable=True)
    summary = db.Column(db.Unicode, nullable=True)
    start_date = db.Column(db.Unicode)
    end_date = db.Column(db.Unicode)
    weight = db.Column(db.Float)

    __mapper_args__ = {
        'polymorphic_on': type,
        'polymorphic_identity': _schema
    }

    def update(self, data, merge=False):
        self.schema_update(data, merge=merge)

    @classmethod
    def save(cls, data, merge=False):
        link = cls.by_id(data.get('id'))
        if link is None:
            schema = data.get('$schema', cls._schema)
            cls = cls.get_schema_class(schema)
            ent = cls()
            ent.id = make_textid()

        link.update(data, merge=merge)
        return ent

    def __repr__(self):
        return '<Link(%r, %r, %r)>' % (self.id, self.type, self.role)

    def to_dict(self):
        data = super(Link, self).to_dict()
        return data


# class EntityAsset(Entity):
#     _schema = 'entity/asset.json#'
#     __mapper_args__ = {
#         'polymorphic_identity': _schema
#     }

#     valuation = db.Column(db.Integer, nullable=True)
#     valuation_currency = db.Column(db.Unicode(100), nullable=True)
#     valuation_date = db.Column(db.Unicode, nullable=True)


# class EntityLegalPerson(Entity):
#     _schema = 'entity/legal_person.json#'
#     __mapper_args__ = {
#         'polymorphic_identity': _schema
#     }

#     image = db.Column(db.Unicode, nullable=True)
#     postal_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
#     postal_address = db.relationship('EntityAddress',
#                                      primaryjoin="and_(EntityAddress.id == foreign(EntityLegalPerson.postal_address_id), "  # noqa
#                                                  "EntityAddress.deleted_at == None)")  # noqa


# class EntityLand(EntityAsset):
#     _schema = '/entity/land.json#'
#     __mapper_args__ = {
#         'polymorphic_identity': _schema
#     }

#     parcel_number = db.Column(db.Unicode, nullable=True)
#     parcel_name = db.Column(db.Unicode, nullable=True)
#     parcel_area = db.Column(db.Integer, nullable=True)
#     parcel_area_units = db.Column(db.Unicode, nullable=True)
#     usage_code = db.Column(db.Unicode, nullable=True)
#     usage_name = db.Column(db.Unicode, nullable=True)


# class EntityBuilding(EntityAsset):
#     _schema = '/entity/building.json#'
#     __mapper_args__ = {
#         'polymorphic_identity': _schema
#     }

#     building_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
#     building_address = db.relationship('EntityAddress',
#                                        primaryjoin="and_(EntityAddress.id == foreign(EntityBuilding.building_address_id), "  # noqa
#                                                    "EntityAddress.deleted_at == None)")  # noqa


# class EntityPerson(EntityLegalPerson):
#     _schema = '/entity/person.json#'
#     __mapper_args__ = {
#         'polymorphic_identity': _schema
#     }

#     gender = db.Column(db.Unicode, nullable=True)
#     birth_date = db.Column(db.Unicode, nullable=True)
#     death_date = db.Column(db.Unicode, nullable=True)

#     residential_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
#     residential_address = db.relationship('EntityAddress',
#                                           primaryjoin="and_(EntityAddress.id == foreign(EntityPerson.residential_address_id), "  # noqa
#                                                       "EntityAddress.deleted_at == None)")  # noqa


# class EntityOrganization(EntityLegalPerson):
#     _schema = '/entity/organization.json#'
#     __mapper_args__ = {
#         'polymorphic_identity': _schema
#     }

#     classification = db.Column(db.Unicode, nullable=True)
#     founding_date = db.Column(db.Unicode, nullable=True)
#     dissolution_date = db.Column(db.Unicode, nullable=True)
#     current_status = db.Column(db.Unicode, nullable=True)

#     registered_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
#     registered_address = db.relationship('EntityAddress',
#                                          primaryjoin="and_(EntityAddress.id == foreign(EntityOrganization.registered_address_id), "  # noqa
#                                                      "EntityAddress.deleted_at == None)")  # noqa

#     headquarters_address_id = db.Column(db.String(32), db.ForeignKey('entity_address.id'))  # noqa
#     headquarters_address = db.relationship('EntityAddress',
#                                            primaryjoin="and_(EntityAddress.id == foreign(EntityOrganization.headquarters_address_id), "  # noqa
#                                                        "EntityAddress.deleted_at == None)")  # noqa


# class EntityCompany(EntityOrganization):
#     _schema = '/entity/company.json#'
#     __mapper_args__ = {
#         'polymorphic_identity': _schema
#     }

#     company_number = db.Column(db.Unicode, nullable=True)
#     sector = db.Column(db.Unicode, nullable=True)
#     company_type = db.Column(db.Unicode, nullable=True)
