from flask import request
from marshmallow import Schema, post_dump
from marshmallow.fields import Nested, String, Boolean
from marshmallow.validate import Email, Length

from aleph.core import url_for
from aleph.serializers.common import BaseSchema
from aleph.model import Role


class RoleSchema(BaseSchema):
    name = String(validate=Length(min=3))
    email = String(validate=Email())
    api_key = String(dump_only=True)
    type = String(dump_only=True)
    foreign_id = String(dump_only=True)
    is_admin = Boolean(dump_only=True)

    @post_dump
    def transient(self, data):
        data['uri'] = url_for('roles_api.view', id=data.get('id'))
        writeable = False
        if str(request.authz.id) == str(data.get('id')):
            writeable = True
        data['writeable'] = writeable
        if not request.authz.is_admin and not writeable:
            data.pop('email')
        if not writeable:
            data.pop('api_key')
        return data


class RoleCodeCreateSchema(Schema):
    email = String(validate=Email(), required=True)


class RoleCreateSchema(Schema):
    name = String()
    password = String(validate=Length(min=Role.PASSWORD_MIN_LENGTH),
                      required=True)
    code = String(required=True)


class RoleReferenceSchema(Schema):
    id = String(required=True)
    name = String(dump_only=True)
    type = String(dump_only=True)


class LoginSchema(Schema):
    email = String(validate=Email(), required=True)
    password = String(validate=Length(min=3))


class PermissionSchema(BaseSchema):
    write = Boolean(required=True)
    read = Boolean(required=True)
    collection_id = String(dump_only=True, required=True)
    role = Nested(RoleReferenceSchema)
