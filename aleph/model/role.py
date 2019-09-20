import logging
from datetime import datetime
from normality import stringify
from sqlalchemy import or_, not_, func
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash, check_password_hash

from aleph.core import db, settings
from aleph.model.common import SoftDeleteModel, IdModel, make_textid
from aleph.util import anonymize_email

log = logging.getLogger(__name__)


membership = db.Table('role_membership',
    db.Column('group_id', db.Integer, db.ForeignKey('role.id')),  # noqa
    db.Column('member_id', db.Integer, db.ForeignKey('role.id'))  # noqa
)


class Role(db.Model, IdModel, SoftDeleteModel):
    """A user, group or other access control subject."""
    __tablename__ = 'role'

    USER = 'user'
    GROUP = 'group'
    SYSTEM = 'system'
    TYPES = [USER, GROUP, SYSTEM]

    SYSTEM_GUEST = 'guest'
    SYSTEM_USER = 'user'

    #: Generates URL-safe signatures for invitations.
    SIGNATURE = URLSafeTimedSerializer(settings.SECRET_KEY)

    #: Signature maximum age, defaults to 1 day
    SIGNATURE_MAX_AGE = 60 * 60 * 24

    foreign_id = db.Column(db.Unicode(2048), nullable=False, unique=True)
    name = db.Column(db.Unicode, nullable=False)
    email = db.Column(db.Unicode, nullable=True)
    api_key = db.Column(db.Unicode, nullable=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    is_muted = db.Column(db.Boolean, nullable=False, default=False)
    type = db.Column(db.Enum(*TYPES, name='role_type'), nullable=False)
    password_digest = db.Column(db.Unicode, nullable=True)
    password = None
    reset_token = db.Column(db.Unicode, nullable=True)
    notified_at = db.Column(db.DateTime, nullable=True)

    permissions = db.relationship('Permission', backref='role')

    @property
    def has_password(self):
        return self.password_digest is not None

    @property
    def is_public(self):
        return self.id in self.public_roles()

    @property
    def is_alertable(self):
        if self.email is None:
            return False
        if self.is_muted is True:
            return False
        # TODO: ignore people that have not logged in for a certain time?
        return True

    @property
    def label(self):
        return anonymize_email(self.name, self.email)

    def update(self, data):
        self.name = data.get('name', self.name)
        self.is_muted = data.get('is_muted', self.is_muted)
        if data.get('password'):
            self.set_password(data.get('password'))
        self.updated_at = datetime.utcnow()

    def clear_roles(self):
        """Removes any existing roles from group membership."""
        self.roles = []
        db.session.add(self)
        self.updated_at = datetime.utcnow()

    def add_role(self, role):
        """Adds an existing role as a membership of a group."""
        self.roles.append(role)
        db.session.add(role)
        db.session.add(self)
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        data = self.to_dict_dates()
        data.update({
            'id': stringify(self.id),
            'type': self.type,
            'name': self.name,
            'label': self.label,
            'email': self.email,
            'api_key': self.api_key,
            'is_admin': self.is_admin,
            'is_muted': self.is_muted,
            'has_password': self.has_password,
            # 'notified_at': self.notified_at
        })
        return data

    @classmethod
    def by_foreign_id(cls, foreign_id):
        if foreign_id is not None:
            return cls.all().filter_by(foreign_id=foreign_id).first()

    @classmethod
    def by_email(cls, email):
        if email is None:
            return None
        q = cls.all()
        q = q.filter(func.lower(cls.email) == email.lower())
        return q.first()

    @classmethod
    def by_api_key(cls, api_key):
        if api_key is not None:
            return cls.all().filter_by(api_key=api_key).first()

    @classmethod
    def load_or_create(cls, foreign_id, type, name, email=None, is_admin=None):
        role = cls.by_foreign_id(foreign_id)

        if role is None:
            role = cls()
            role.foreign_id = foreign_id
            role.name = name or email
            role.type = type
            role.is_admin = False
            role.notified_at = datetime.utcnow()

        if role.api_key is None:
            role.api_key = make_textid()

        if email is not None:
            role.email = email

        if is_admin is not None:
            role.is_admin = is_admin

        # see: https://github.com/alephdata/aleph/issues/111
        auto_admins = [a.lower() for a in settings.ADMINS]
        if email is not None and email.lower() in auto_admins:
            role.is_admin = True

        db.session.add(role)
        db.session.flush()
        return role

    @classmethod
    def load_cli_user(cls):
        return cls.load_or_create(foreign_id=settings.SYSTEM_USER,
                                  name='Aleph',
                                  type=cls.USER,
                                  is_admin=True)

    @classmethod
    def load_id(cls, foreign_id):
        """Load a role and return the ID."""
        if not hasattr(settings, '_roles'):
            settings._roles = {}
        if foreign_id not in settings._roles:
            role_id, = cls.all_ids().filter_by(foreign_id=foreign_id).first()
            if role_id is not None:
                settings._roles[foreign_id] = role_id
        return settings._roles.get(foreign_id)

    @classmethod
    def public_roles(cls):
        """Roles which make a collection to be considered public."""
        return set([
            cls.load_id(cls.SYSTEM_USER),
            cls.load_id(cls.SYSTEM_GUEST),
        ])

    @classmethod
    def by_prefix(cls, prefix, exclude=[]):
        """Load a list of roles matching a name, email address, or foreign_id.

        :param str pattern: Pattern to match.
        """
        q = cls.all()
        q = q.filter(Role.type == Role.USER)
        if len(exclude):
            q = q.filter(not_(Role.id.in_(exclude)))
        q = q.filter(or_(
            func.lower(cls.email) == prefix.lower(),
            cls.name.ilike('%' + prefix + '%')
        ))
        q = q.order_by(Role.id.asc())
        return q

    @classmethod
    def all_groups(cls):
        return cls.all().filter(Role.type != Role.USER)

    @classmethod
    def all_users(cls):
        return cls.all().filter(Role.type == Role.USER)

    def set_password(self, secret):
        """Hashes and sets the role password.

        :param str secret: The password to be set.
        """
        self.password_digest = generate_password_hash(secret)

    def check_password(self, secret):
        """Checks the password if it matches the role password hash.

        :param str secret: The password to be checked.
        :rtype: bool
        """
        return check_password_hash(self.password_digest or '', secret)

    def __repr__(self):
        return '<Role(%r,%r)>' % (self.id, self.foreign_id)


Role.members = db.relationship(Role,
                               secondary=membership,
                               primaryjoin=Role.id == membership.c.group_id,
                               secondaryjoin=Role.id == membership.c.member_id,
                               backref="roles")
