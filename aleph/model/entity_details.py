from aleph.core import db
from aleph.model.common import SoftDeleteModel, IdModel


class EntityIdentifier(db.Model, IdModel, SoftDeleteModel):
    _schema = 'entity/identifier.json#'

    identifier = db.Column(db.Unicode)
    scheme = db.Column(db.Unicode)


class EntityOtherName(db.Model, IdModel, SoftDeleteModel):
    _schema = 'entity/other_name.json#'

    name = db.Column(db.Unicode)
    note = db.Column(db.Unicode)
    family_name = db.Column(db.Unicode)
    given_name = db.Column(db.Unicode)
    additional_name = db.Column(db.Unicode)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)


class EntityAddress(db.Model, IdModel, SoftDeleteModel):
    _schema = 'entity/address.json#'

    text = db.Column(db.Unicode)
    street_address = db.Column(db.Unicode)
    locality = db.Column(db.Unicode)
    region = db.Column(db.Unicode)
    postal_code = db.Column(db.Unicode)
    country = db.Column(db.Unicode)


class EntityContactDetail(db.Model, IdModel, SoftDeleteModel):
    _schema = 'entity/contact_detail.json#'

    label = db.Column(db.Unicode)
    type = db.Column(db.Unicode)
    note = db.Column(db.Unicode)
    valid_from = db.Column(db.DateTime)
    valid_until = db.Column(db.DateTime)
