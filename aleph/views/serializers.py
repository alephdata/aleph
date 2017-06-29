from apikit import jsonify as jsonify_
from flask import request
from werkzeug.exceptions import BadRequest
from dalet import is_country_code, is_language_code
from marshmallow import Schema, post_dump
from marshmallow.fields import Nested, Integer, String, Bool, DateTime, List
from marshmallow.fields import Raw, Dict
from marshmallow.exceptions import ValidationError
from marshmallow.validate import Email, Length

from aleph.core import url_for, get_config
from aleph.model import Role


class Category(String):

    def _validate(self, value):
        categories = get_config('COLLECTION_CATEGORIES', {})
        if value not in categories.keys():
            raise ValidationError('Invalid category.')


class Language(String):

    def _validate(self, value):
        if not is_language_code(value):
            raise ValidationError('Invalid language code.')


class Country(String):

    def _validate(self, value):
        if not is_country_code(value):
            raise ValidationError('Invalid country code.')


class DatedSchema(object):
    # these are raw because dumping fails if the dates are already strings, as
    # in the case of data coming from the ES index.
    created_at = Raw(dump_only=True)
    updated_at = Raw(dump_only=True)


class RoleSchema(Schema, DatedSchema):
    id = Integer(dump_only=True)
    name = String(validate=Length(min=3))
    email = String(validate=Email())
    api_key = String(dump_only=True)
    type = String(dump_only=True)
    foreign_id = String(dump_only=True)
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
    email = String(validate=Email(), required=True)


class RoleCreateSchema(Schema, DatedSchema):
    email = String(validate=Email(), required=True)
    name = String()
    password = String(validate=Length(min=Role.PASSWORD_MIN_LENGTH),
                      required=True)
    code = String(required=True)


class RoleReferenceSchema(Schema):
    id = Integer(required=True)
    name = String(dump_only=True)
    type = String(dump_only=True)


class PermissionSchema(Schema, DatedSchema):
    id = Integer(dump_only=True)
    write = Bool(required=True)
    read = Bool(required=True)
    collection_id = Integer(dump_only=True, required=True)
    role = Nested(RoleReferenceSchema)


class AlertSchema(Schema, DatedSchema):
    id = Integer(dump_only=True)
    query_text = String()
    entity_id = String()
    label = String()
    role = Nested(RoleReferenceSchema, dump_only=True)
    notified_at = DateTime(dump_only=True)

    @post_dump
    def transient(self, data):
        data['$uri'] = url_for('alerts_api.view', id=data.get('id'))
        data['$writeable'] = True
        return data


class CollectionSchema(Schema, DatedSchema):
    id = Integer(dump_only=True)
    label = String(validate=Length(min=2, max=500), required=True)
    foreign_id = String()
    summary = String(allow_none=True)
    countries = List(Country)
    lanaguages = List(Language)
    managed = Bool()
    category = Category(required=True)
    creator = Nested(RoleReferenceSchema, required=False, allow_none=True)

    @post_dump
    def transient(self, data):
        data['$uri'] = url_for('collections_api.view', id=data.get('id'))
        data['$writeable'] = request.authz.can_write(data.get('id'))
        return data


class CollectionIndexSchema(CollectionSchema):
    total = Integer(dump_to='$total', attribute='$total',
                    dump_only=True, default=0)
    entities = Integer(dump_to='$entities', attribute='$entities',
                       dump_only=True, default=0)
    documents = Integer(dump_to='$documents', attribute='$documents',
                        dump_only=True, default=0)
    schemata = Dict(dump_to='$schemata', attribute='$schemata',
                    dump_only=True, default={})


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
        # from pprint import pprint
        # pprint(data)
        data, errors = schema().load(data)
        if len(errors):
            raise BadRequest(response=jsonify({
                'status': 'error',
                'errors': errors
            }, status=400))
    return data
