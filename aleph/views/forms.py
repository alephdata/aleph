from banal import ensure_dict
from normality import stringify
from flask_babel import gettext
from urlnormalizer import normalize_url
from followthemoney import model
from followthemoney.types import registry
from marshmallow import Schema, pre_load
from marshmallow.fields import List, Integer
from marshmallow.fields import Dict, String, Boolean
from marshmallow.validate import Email, Length
from marshmallow.exceptions import ValidationError

from aleph import settings
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
            raise ValidationError(gettext('Invalid category.'))


class Url(String):

    def _deserialize(self, value, attr, data):
        return stringify(value)

    def _validate(self, value):
        if value is not None and normalize_url(value) is None:
            raise ValidationError(gettext('Invalid URL.'))


class Language(String):
    """A valid language code."""

    def _deserialize(self, value, attr, data):
        return registry.language.clean(value)

    def _validate(self, value):
        if not registry.language.validate(value):
            raise ValidationError(gettext('Invalid language code.'))


class Locale(String):
    """A user locale."""

    def _deserialize(self, value, attr, data):
        return stringify(value)

    def _validate(self, value):
        if value not in settings.UI_LANGUAGES:
            raise ValidationError(gettext('Invalid user locale.'))


class Country(String):
    """A valid country code."""

    def _deserialize(self, value, attr, data):
        return registry.country.clean(value)

    def _validate(self, value):
        if not registry.country.validate(value):
            msg = gettext('Invalid country code: %s')
            raise ValidationError(msg % value)


class PartialDate(String):
    """Any valid prefix of an ISO 8601 datetime string."""

    def _validate(self, value):
        if not registry.date.validate(value):
            raise ValidationError(gettext('Invalid date: %s') % value)


class SchemaName(String):

    def _validate(self, value):
        schema = model.get(value)
        if schema is None or schema.abstract:
            msg = gettext('Invalid schema name: %s')
            raise ValidationError(msg % value)


class RoleSchema(Schema):
    name = String(validate=Length(min=4))
    is_muted = Boolean(missing=None)
    password = String(validate=MIN_PASSWORD, missing=None, load_only=True)
    current_password = String(missing=None, load_only=True)
    locale = Locale(allow_none=True, missing=None)


class RoleCodeCreateSchema(Schema):
    email = String(validate=Email(), required=True)


class RoleCreateSchema(Schema):
    name = String(validate=Length(min=4))
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
    summary = String(allow_none=True, missing=None)
    publisher = String(allow_none=True, missing=None)
    publisher_url = Url(allow_none=True, missing=None)
    data_url = Url(allow_none=True, missing=None)
    info_url = Url(allow_none=True, missing=None)
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
