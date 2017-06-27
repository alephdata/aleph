from apikit import jsonify as jsonify_
from flask import request
from werkzeug.exceptions import BadRequest
from marshmallow import Schema, post_dump
from marshmallow.fields import Nested, Integer, Str, Bool, DateTime
from marshmallow.validate import Email, Length

from aleph.core import url_for
from aleph.model import Role


class DatedSchema(object):
    created_at = DateTime(dump_only=True)
    updated_at = DateTime(dump_only=True)


class RoleSchema(Schema, DatedSchema):
    id = Integer(dump_only=True)
    name = Str(validate=Length(min=3))
    email = Str(validate=Email())
    api_key = Str(dump_only=True)
    type = Str(dump_only=True)
    foreign_id = Str(dump_only=True)
    is_admin = Bool(dump_only=True)

    @post_dump
    def transient(self, data):
        data['$uri'] = url_for('roles_api.view', id=data.get('id'))
        writeable = False
        if request.authz.id == data.get('id'):
            writeable = True
        data['$writeable'] = writeable
        if not request.authz.is_admin and not writeable:
            data.pop('email')
        if not writeable:
            data.pop('api_key')
        return data


class RoleInviteSchema(Schema, DatedSchema):
    email = Str(validate=Email(), required=True)


class RoleCreateSchema(Schema, DatedSchema):
    email = Str(validate=Email(), required=True)
    name = Str()
    password = Str(validate=Length(min=Role.PASSWORD_MIN_LENGTH),
                   required=True)
    code = Str(required=True)


class RoleReferenceSchema(Schema, DatedSchema):
    id = Integer(required=True)
    name = Str(dump_only=True)
    type = Str(dump_only=True)
    foreign_id = Str(dump_only=True)


class PermissionSchema(Schema, DatedSchema):
    id = Integer(dump_only=True)
    write = Bool(required=True)
    read = Bool(required=True)
    collection_id = Integer(dump_only=True, required=True)
    role = Nested(RoleReferenceSchema)


class AlertSchema(Schema, DatedSchema):
    id = Integer(dump_only=True)
    query_text = Str()
    entity_id = Str()
    label = Str()
    role = Nested(RoleReferenceSchema, dump_only=True)
    notified_at = DateTime(dump_only=True)

    @post_dump
    def transient(self, data):
        data['$uri'] = url_for('alerts_api.view', id=data.get('id'))
        data['$writeable'] = True
        return data


def jsonify(obj, schema=None, status=200, **kwargs):
    if schema is not None:
        obj, _ = schema().dump(obj)
    return jsonify_(obj, status=status, **kwargs)


def parse_request(schema=None):
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict(flat=True)
    if schema is not None:
        data, errors = schema().load(data)
        if len(errors):
            raise BadRequest(response=jsonify({
                'status': 'error',
                'errors': errors
            }, status=400))
    return data
