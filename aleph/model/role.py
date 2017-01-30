import logging
from datetime import datetime

from flask import current_app
from sqlalchemy.exc import IntegrityError

from aleph.core import db, url_for, get_config
from aleph.data.validate import validate
from aleph.model.common import SoftDeleteModel, IdModel, make_textid
from aleph.model import Credential

log = logging.getLogger(__name__)


membership = db.Table('role_membership',
    db.Column('group_id', db.Integer, db.ForeignKey('role.id')),  # noqa
    db.Column('member_id', db.Integer, db.ForeignKey('role.id'))  # noqa
)


class Role(db.Model, IdModel, SoftDeleteModel):
    """A user, group or other access control subject."""

    _schema = 'role.json#'
    __tablename__ = 'role'

    USER = 'user'
    GROUP = 'group'
    SYSTEM = 'system'
    TYPES = [USER, GROUP, SYSTEM]

    SYSTEM_GUEST = 'guest'
    SYSTEM_USER = 'user'

    name = db.Column(db.Unicode, nullable=False)
    email = db.Column(db.Unicode, nullable=True)
    api_key = db.Column(db.Unicode, nullable=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    type = db.Column(db.Enum(*TYPES, name='role_type'), nullable=False)
    permissions = db.relationship('Permission', backref='role')

    def update(self, data):
        validate(data, self._schema)
        self.name = data.get('name', self.name)
        self.email = data.get('email', self.email)

    def clear_roles(self):
        """Removes any existing roles from group membership."""
        self.roles = []
        db.session.add(self)

    def add_role(self, role):
        """Adds an existing role as a membership of a group."""
        self.roles.append(role)
        db.session.add(role)
        db.session.add(self)

    @classmethod
    def notifiable(cls):
        return cls.all_ids().filter(cls.email != None)  # noqa

    @classmethod
    def by_foreign_id(cls, foreign_id):
        if foreign_id is not None:
            return cls.all().join(cls.credentials).filter(
                Credential.foreign_id == foreign_id
            ).first()

    @classmethod
    def by_api_key(cls, api_key):
        if api_key is not None:
            return cls.all().filter_by(api_key=api_key).first()

    @classmethod
    def load_or_create(cls, foreign_id, type, name, email=None, is_admin=None):
        role = cls.by_foreign_id(foreign_id)
        if role is None:
            role = cls()
            role.name = name
            role.type = type
            role.is_admin = False

        if role.api_key is None:
            role.api_key = make_textid()

        role.email = email
        if is_admin is not None:
            role.is_admin = is_admin

        # see: https://github.com/pudo/aleph/issues/111
        auto_admins = get_config('AUTHZ_ADMINS') or ''
        auto_admins = [a.lower() for a in auto_admins.split(',')]
        if email is not None and email.lower() in auto_admins:
            role.is_admin = True

        db.session.add(role)
        db.session.flush()

        role.load_or_create_credentials(foreign_id)

        return role

    @classmethod
    def load_id(cls, foreign_id, type=None, name=None):
        """Load a role and return the ID.

        If type is given and no role is found, a new role will be created.
        """
        if not hasattr(current_app, '_authz_roles'):
            current_app._authz_roles = {}
        if foreign_id not in current_app._authz_roles:
            role = cls.by_foreign_id(foreign_id)
            if role is None:
                if type is None:
                    return
                name = name or foreign_id
                role = cls.load_or_create(foreign_id, type, name)
            current_app._authz_roles[foreign_id] = role.id
        return current_app._authz_roles[foreign_id]

    @classmethod
    def authenticate_using_credential(cls, email, password):
        """Autheticates an user based on the email and password.

        :param str email: User email.
        :param str password: User password.
        :return: A matched role.
        :rtype: :py:class:`Role`
        """
        credential = db.session.query(Credential).join(cls).filter(
            cls.email == email,
            Credential.secret != None,
            ~Credential.source.in_(Credential.EXTERNAL_SOURCES),
            db.func.crypt(password, Credential.secret) == Credential.secret
        ).first()

        if not credential:
            return

        credential.used_at = datetime.utcnow()
        db.session.commit()

        return credential.role

    def load_or_create_credentials(self, foreign_id):
        """Returns role credentials based on the foreign identifier.

        If the credentials do not exist, it will create it.

        :param string foreign_id: Foreign identifier, ex.: `oauth:ID`.
        :rtype: :py:class:`aleph.model.Credential`
        """
        source = Credential.PASSWORD

        for existing_source in Credential.SOURCES:
            if existing_source in foreign_id:
                source = existing_source

        if source == Credential.PASSWORD:
            foreign_id = '{}:{}'.format(source, self.id)

        cred = Credential()
        cred.role = self
        cred.source = source
        cred.foreign_id = foreign_id
        cred.used_at = datetime.utcnow()
        db.session.add(cred)

        try:
            db.session.commit()
        except IntegrityError as err:
            db.session.rollback()
            cred = self.credentials.filter_by(foreign_id=foreign_id).first()

        return cred

    def __repr__(self):
        return '<Role(%r,%r)>' % (self.id, self.email)

    def __unicode__(self):
        return self.name

    def to_dict(self):
        data = super(Role, self).to_dict()
        data.update({
            'api_url': url_for('roles_api.view', id=self.id),
            'is_admin': self.is_admin,
            'email': self.email,
            'name': self.name,
            'type': self.type
        })
        return data


Role.members = db.relationship(Role, secondary=membership,
                               primaryjoin=Role.id == membership.c.group_id,
                               secondaryjoin=Role.id == membership.c.member_id,
                               backref="roles")
