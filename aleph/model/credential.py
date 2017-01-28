from aleph.core import db
from aleph.model.common import UuidModel, DatedModel


class Credential(db.Model, UuidModel, DatedModel):
    """A role can own multiple credentials and can authenticate by using any of
    the credentials.

    The concept behind this is to provide multiple authentication strategies
    for a single role: from password-based authentication to OAuth or LDAP.
    """

    OAUTH = 'oauth'
    PASSWORD = 'password'
    LDAP = 'ldap'
    SOURCES = [OAUTH, PASSWORD, LDAP]

    __tablename__ = 'credential'

    #: Indicates credential source, ex.: oauth, passoword, ldap...
    source = db.Column(
        db.Enum(*SOURCES, name='credential_source'),
        nullable=False
    )

    #: Foreign identifier, migrated from the initial `role` table.
    foreign_id = db.Column(db.Unicode(2048), nullable=False, unique=True)
    #: Secret to _unlock_ the credential, aka password encrypted hash.
    secret = db.Column(db.LargeBinary(60))
    #: Token to allow resetting the secret.
    reset_token = db.Column(db.Unicode(32), unique=True, index=True)
    #: Last date/time when credential was used.
    used_at = db.Column(db.DateTime)

    #: Role relationship.
    role_id = db.Column(
        db.Integer, db.ForeignKey('role.id', ondelete='CASCADE'), index=True)
    role = db.relationship(
        'Role', backref=db.backref('credentials', lazy='dynamic'))
