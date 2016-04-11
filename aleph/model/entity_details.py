from aleph.core import db
from aleph.model.validation import SchemaModel
from aleph.model.common import SoftDeleteModel, IdModel


class EntityDetails(IdModel, SoftDeleteModel, SchemaModel):

    def update(self, data):
        self.schema_update(data)


class EntityIdentifier(db.Model, EntityDetails):
    _schema = '/entity/identifier.json#'

    entity_id = db.Column(db.Integer(), db.ForeignKey('entity.id'), index=True)
    entity = db.relationship('Entity', backref=db.backref('identifiers', lazy='dynamic', cascade='all, delete-orphan'))  # noqa
    identifier = db.Column(db.Unicode)
    scheme = db.Column(db.Unicode)


class EntityOtherName(db.Model, EntityDetails):
    _schema = '/entity/other_name.json#'

    entity_id = db.Column(db.Integer(), db.ForeignKey('entity.id'), index=True)
    entity = db.relationship('Entity', backref=db.backref('other_names', lazy='dynamic', cascade='all, delete-orphan'))  # noqa
    name = db.Column(db.Unicode)
    note = db.Column(db.Unicode)
    family_name = db.Column(db.Unicode)
    given_name = db.Column(db.Unicode)
    additional_name = db.Column(db.Unicode)
    honorific_prefix = db.Column(db.Unicode)
    honorific_suffix = db.Column(db.Unicode)
    patronymic_name = db.Column(db.Unicode)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)

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

    entity_id = db.Column(db.Integer(), db.ForeignKey('entity.id'), index=True)
    entity = db.relationship('EntityLegalPerson', backref=db.backref('contact_details',
        lazy='dynamic', cascade='all, delete-orphan'))  # noqa

    label = db.Column(db.Unicode)
    type = db.Column(db.Unicode)
    note = db.Column(db.Unicode)
    valid_from = db.Column(db.DateTime)
    valid_until = db.Column(db.DateTime)


class EntityAddress(db.Model, EntityDetails):
    _schema = '/entity/address.json#'

    text = db.Column(db.Unicode)
    street_address = db.Column(db.Unicode)
    locality = db.Column(db.Unicode)
    region = db.Column(db.Unicode)
    postal_code = db.Column(db.Unicode)
    country = db.Column(db.Unicode)
