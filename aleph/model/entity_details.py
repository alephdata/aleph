from aleph.core import db
from aleph.model.schema_model import SchemaModel
from aleph.model.common import SoftDeleteModel, UuidModel, make_textid


class EntityDetails(UuidModel, SoftDeleteModel, SchemaModel):

    def update(self, data):
        if self.id is None:
            self.id = make_textid()
        self.schema_update(data)


class EntityIdentifier(db.Model, EntityDetails):
    _schema = '/entity/identifier.json#'
    __tablename__ = 'entity_identifier'

    entity_id = db.Column(db.String(32), db.ForeignKey('entity.id'), index=True)
    entity = db.relationship('Entity', primaryjoin="and_(Entity.id == foreign(EntityIdentifier.entity_id), "  # noqa
                                                        "EntityIdentifier.deleted_at == None)",  # noqa
                             backref=db.backref('identifiers', lazy='dynamic', cascade='all, delete-orphan'))  # noqa
    identifier = db.Column(db.Unicode)
    scheme = db.Column(db.Unicode)


class EntityOtherName(db.Model, EntityDetails):
    _schema = '/entity/other_name.json#'

    entity_id = db.Column(db.String(32), db.ForeignKey('entity.id'), index=True)
    entity = db.relationship('Entity', primaryjoin="and_(Entity.id == foreign(EntityOtherName.entity_id), "  # noqa
                                                        "EntityOtherName.deleted_at == None)",  # noqa
                             backref=db.backref('other_names', cascade='all, delete-orphan'))  # noqa
    name = db.Column(db.Unicode)
    note = db.Column(db.Unicode)
    family_name = db.Column(db.Unicode)
    given_name = db.Column(db.Unicode)
    additional_name = db.Column(db.Unicode)
    honorific_prefix = db.Column(db.Unicode)
    honorific_suffix = db.Column(db.Unicode)
    patronymic_name = db.Column(db.Unicode)
    start_date = db.Column(db.Unicode)
    end_date = db.Column(db.Unicode)

    @property
    def display_name(self):
        if self.name is not None:
            return self.name
        return ''

    @property
    def terms(self):
        return [self.display_name]

    def to_dict(self):
        data = super(EntityOtherName, self).to_dict()
        data['display_name'] = self.display_name
        return data


class EntityContactDetail(db.Model, EntityDetails):
    _schema = '/entity/contact_detail.json#'

    entity_id = db.Column(db.String(32), db.ForeignKey('entity.id'), index=True)
    entity = db.relationship('EntityLegalPerson', primaryjoin="and_(Entity.id == foreign(EntityContactDetail.entity_id), "  # noqa
                                                              "EntityContactDetail.deleted_at == None)",  # noqa
                             backref=db.backref('contact_details', lazy='dynamic', cascade='all, delete-orphan'))  # noqa

    label = db.Column(db.Unicode)
    type = db.Column(db.Unicode)
    note = db.Column(db.Unicode)
    valid_from = db.Column(db.Unicode)
    valid_until = db.Column(db.Unicode)


class EntityAddress(db.Model, EntityDetails):
    _schema = '/entity/address.json#'

    text = db.Column(db.Unicode)
    street_address = db.Column(db.Unicode)
    locality = db.Column(db.Unicode)
    region = db.Column(db.Unicode)
    postal_code = db.Column(db.Unicode)
    country = db.Column(db.Unicode)
