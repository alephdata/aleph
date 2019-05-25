from banal import ensure_dict
from normality import stringify
from followthemoney import model
from followthemoney.types import registry
from marshmallow import Schema, pre_load
from marshmallow.fields import List, Integer
from marshmallow.fields import Url, Dict, String, Boolean
from marshmallow.validate import Email, Length
from marshmallow.exceptions import ValidationError

from aleph.model import Collection


MIN_PASSWORD = Length(min=6)


def flatten(data, target, source):
    """Move a nested object with an ID to a direct key."""
    data = ensure_dict(data)
    value = stringify(data.get(target))
    if value is None:
        value = stringify(ensure_dict(data.get(source)).get('id'))
    data[target] = value
    return data


class Category(String):
    """A category of collections, e.g. leaks, court cases, sanctions list."""

    def _validate(self, value):
        if value not in Collection.CATEGORIES.keys():
            raise ValidationError('Invalid category.')


class Language(String):
    """A valid language code."""

    def _validate(self, value):
        if not registry.language.validate(value):
            raise ValidationError('Invalid language code.')


class Country(String):
    """A valid country code."""

    def _validate(self, value):
        if not registry.country.validate(value):
            raise ValidationError('Invalid country code: %s' % value)


class PartialDate(String):
    """Any valid prefix of an ISO 8601 datetime string."""

    def _validate(self, value):
        if not registry.date.validate(value):
            raise ValidationError('Invalid date: %s' % value)


class SchemaName(String):

    def _validate(self, value):
        schema = model.get(value)
        if schema is None or schema.abstract:
            raise ValidationError('Invalid schema name: %s' % value)


class RoleSchema(Schema):
    name = String(validate=Length(min=3))
    is_muted = Boolean(missing=None)
    password = String(validate=MIN_PASSWORD, missing=None, load_only=True)


class RoleCodeCreateSchema(Schema):
    email = String(validate=Email(), required=True)


class RoleCreateSchema(Schema):
    name = String()
    password = String(validate=MIN_PASSWORD, required=True)
    code = String(required=True)


class LoginSchema(Schema):
    email = String(validate=Email(), required=True)
    password = String(validate=Length(min=3))


class PermissionSchema(Schema):
    write = Boolean(required=True)
    read = Boolean(required=True)
    role_id = String(required=True)

    @pre_load
    def flatten(self, data):
        return flatten(data, 'role_id', 'role')


class AlertSchema(Schema):
    query = String()


class XrefSchema(Schema):
    against_collection_ids = List(Integer())


class CollectionCreateSchema(Schema):
    label = String(validate=Length(min=2, max=500), required=True)
    foreign_id = String(missing=None)
    casefile = Boolean(missing=None)
    summary = String(allow_none=True)
    publisher = String(allow_none=True)
    publisher_url = Url(allow_none=True)
    data_url = Url(allow_none=True)
    info_url = Url(allow_none=True)
    countries = List(Country())
    languages = List(Language())
    category = Category(missing=None)


class CollectionUpdateSchema(CollectionCreateSchema):
    creator_id = String(allow_none=True)

    @pre_load
    def flatten(self, data):
        return flatten(data, 'creator_id', 'creator')


class EntityUpdateSchema(Schema):
    schema = SchemaName(required=True)
    properties = Dict()


class EntityCreateSchema(EntityUpdateSchema):
    foreign_id = String()
    collection_id = String(required=True)

    @pre_load
    def flatten(self, data):
        return flatten(data, 'collection_id', 'collection')


class DocumentCreateSchema(Schema):
    title = String(allow_none=True)
    summary = String(allow_none=True)
    countries = List(Country())
    languages = List(Language())
    keywords = List(String(validate=Length(min=0, max=5000)))
    date = PartialDate(allow_none=True)
    authored_at = PartialDate(allow_none=True)
    modified_at = PartialDate(allow_none=True)
    published_at = PartialDate(allow_none=True)
    retrieved_at = PartialDate(allow_none=True)
    file_name = String(allow_none=True)
    author = String(allow_none=True)
    generator = String(allow_none=True)
    crawler = String(allow_none=True)
    mime_type = String(allow_none=True)
    source_url = String(allow_none=True)
    parent_id = String(allow_none=True)

    @pre_load
    def flatten(self, data):
        return flatten(data, 'parent_id', 'parent')
