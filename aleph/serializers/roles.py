from flask import request
from marshmallow import Schema, post_dump
from marshmallow.fields import Nested, String, Boolean
from marshmallow.validate import Email, Length

from aleph.core import url_for
from aleph.serializers.common import BaseSchema
from aleph.model import Role

MIN_LENGTH = Length(min=Role.PASSWORD_MIN_LENGTH)


class RoleSchema(BaseSchema):
    name = String(validate=Length(min=3))
    email = String(dump_only=True)
    api_key = String(dump_only=True)
    password = String(validate=MIN_LENGTH, missing=None)
    type = String(dump_only=True)
    is_admin = Boolean(dump_only=True)
    has_password = Boolean(dump_only=True)

    @post_dump
    def transient(self, data):
        pk = str(data.get('id'))
        data['links'] = {
            'self': url_for('roles_api.view', id=pk)
        }
        data['writeable'] = str(request.authz.id) == pk
        if not data['writeable']:
            data.pop('api_key', None)
            data.pop('email', None)
            data.pop('password', None)
            data.pop('has_password', None)
        return data


class RoleCodeCreateSchema(Schema):
    email = String(validate=Email(), required=True)


class RoleCreateSchema(Schema):
    name = String()
    password = String(validate=MIN_LENGTH, required=True)
    code = String(required=True)


class RoleReferenceSchema(RoleSchema):
    id = String(required=True)


class LoginSchema(Schema):
    email = String(validate=Email(), required=True)
    password = String(validate=Length(min=3))


class PermissionSchema(BaseSchema):
    write = Boolean(required=True)
    read = Boolean(required=True)
    collection_id = String(dump_only=True)
    role = Nested(RoleReferenceSchema)
