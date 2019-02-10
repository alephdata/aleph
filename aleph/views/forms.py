from followthemoney import model
from followthemoney.types import registry
from marshmallow import Schema
from marshmallow.fields import Nested, List, Integer
from marshmallow.fields import Url, Dict, String, Boolean
from marshmallow.validate import Email, Length
from marshmallow.exceptions import ValidationError

from aleph.model import Collection


MIN_PASSWORD = Length(min=6)


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


class RoleReferenceSchema(Schema):
    id = String(required=True)


class CollectionReferenceSchema(Schema):
    id = String(required=True)


class LoginSchema(Schema):
    email = String(validate=Email(), required=True)
    password = String(validate=Length(min=3))


class PermissionSchema(Schema):
    write = Boolean(required=True)
    read = Boolean(required=True)
    role = Nested(RoleReferenceSchema)


class AlertSchema(Schema):
    query = String()


class XrefSchema(Schema):
    against_collection_ids = List(Integer())


class CollectionSchema(Schema):
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
    creator = Nested(RoleReferenceSchema())


class EntityUpdateSchema(Schema):
    id = String(allow_none=True)
    name = String(allow_none=True)
    schema = SchemaName(required=True)
    properties = Dict()


class EntityCreateSchema(EntityUpdateSchema):
    collection = Nested(CollectionReferenceSchema())
    foreign_id = String()


class EntityReferenceSchema(Schema):
    id = String(allow_none=True)
    foreign_id = String(allow_none=True)


class DocumentCreateSchema(Schema):
    title = String(allow_none=True)
    summary = String(allow_none=True)
    countries = List(Country())
    languages = List(Language())
    keywords = List(String(validate=Length(min=1, max=5000)))
    date = PartialDate(allow_none=True)
    authored_at = PartialDate(allow_none=True)
    modified_at = PartialDate(allow_none=True)
    published_at = PartialDate(allow_none=True)
    retrieved_at = PartialDate(allow_none=True)
    file_name = String(allow_none=True)
    author = String(allow_none=True)
    generator = String(allow_none=True)
    mime_type = String(allow_none=True)
    source_url = String(allow_none=True)
    parent = Nested(EntityReferenceSchema())
