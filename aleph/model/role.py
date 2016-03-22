from uuid import uuid4
from flask import current_app

from aleph.core import db
from aleph.model.validation import validate
from aleph.model.common import SoftDeleteModel


class Role(db.Model, SoftDeleteModel):
    """A user, group or other access control subject."""

    __tablename__ = 'role'

    USER = 'user'
    GROUP = 'group'
    SYSTEM = 'system'
    TYPES = [USER, GROUP, SYSTEM]

    SYSTEM_GUEST = 'guest'
    SYSTEM_USER = 'user'

    id = db.Column(db.Integer, primary_key=True)
    foreign_id = db.Column(db.Unicode(2048), nullable=False, unique=True)
    name = db.Column(db.Unicode, nullable=False)
    email = db.Column(db.Unicode, nullable=True)
    api_key = db.Column(db.Unicode, nullable=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    type = db.Column(db.Enum(*TYPES, name='role_type'), nullable=False)
    permissions = db.relationship("Permission", backref="role")

    def update(self, data):
        validate(data, 'role.json#')
        self.name = data.get('name')
        self.email = data.get('email')

    @classmethod
    def notifiable(cls):
        return cls.all_ids().filter(cls.email != None)  # noqa

    @classmethod
    def by_foreign_id(cls, foreign_id):
        if foreign_id is not None:
            return cls.all().filter_by(foreign_id=foreign_id).first()

    @classmethod
    def by_api_key(cls, api_key):
        if api_key is not None:
            return cls.all().filter_by(api_key=api_key).first()

    @classmethod
    def load_or_create(cls, foreign_id, type, name, email=None,
                       is_admin=False):
        role = cls.by_foreign_id(foreign_id)
        if role is None:
            role = cls()
            role.foreign_id = foreign_id
            role.type = type
        if role.api_key is None:
            role.api_key = uuid4().hex
        role.name = name
        role.email = email
        role.is_admin = is_admin
        db.session.add(role)
        db.session.flush()
        return role

    @classmethod
    def system(cls, foreign_id):
        if not hasattr(current_app, '_authz_roles'):
            current_app._authz_roles = {}
        if foreign_id not in current_app._authz_roles:
            role = cls.by_foreign_id(foreign_id)
            if role is None:
                return
            current_app._authz_roles[foreign_id] = role.id
        return current_app._authz_roles[foreign_id]

    def __repr__(self):
        return '<Role(%r,%r)>' % (self.id, self.foreign_id)

    def __unicode__(self):
        return self.name

    def to_dict(self):
        return {
            'id': self.id,
            'foreign_id': self.foreign_id,
            'name': self.name,
            'is_admin': self.is_admin,
            'email': self.email,
            'type': self.type
        }
