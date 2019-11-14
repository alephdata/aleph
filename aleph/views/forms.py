import os

from banal import ensure_dict
from normality import stringify
from flask_babel import gettext
from urlnormalizer import normalize_url
from followthemoney import model
from followthemoney.types import registry
from jsonschema import FormatChecker, validate
import jsonref

from aleph import settings
from aleph.core import cache
from aleph.model import Collection


@FormatChecker.cls_checks("locale", raises=ValueError)
def check_locale(value):
    value = stringify(value)
    if value not in settings.UI_LANGUAGES:
        raise ValueError(gettext('Invalid user locale.'))
    return True


@FormatChecker.cls_checks("country", raises=ValueError)
def check_country_code(value):
    value = registry.country.clean(value)
    if not registry.country.validate(value):
        msg = gettext('Invalid country code: %s')
        raise ValueError(msg % value)
    return True


@FormatChecker.cls_checks("category", raises=ValueError)
def check_category(value):
    if value not in Collection.CATEGORIES.keys():
        raise ValueError(gettext('Invalid category.'))
    return True


@FormatChecker.cls_checks("url", raises=ValueError)
def check_url(value):
    value = stringify(value)
    if value is not None and normalize_url(value) is None:
        raise ValueError(gettext('Invalid URL.'))
    return True


@FormatChecker.cls_checks("language", raises=ValueError)
def check_language(value):
    value = registry.language.clean(value)
    if not registry.language.validate(value):
        raise ValueError(gettext('Invalid language code.'))
    return True


@FormatChecker.cls_checks("schema", raises=ValueError)
def check_schema(value):
    schema = model.get(value)
    if schema is None or schema.abstract:
        msg = gettext('Invalid schema name: %s')
        raise ValueError(msg % value)
    return True


@FormatChecker.cls_checks("partial-date", raises=ValueError)
def check_partial_date(value):
    if not registry.date.validate(value):
        raise ValueError(gettext('Invalid date: %s') % value)
    return True


class Schema():

    SCHEMA_NAME = None
    PREFIX = 'schema'

    def __init__(self, schema=None):
        self.schema = self.load_json_schema(schema_name=schema)

    def load_json_schema(self, schema_name=None):
        """Loads the given schema file"""
        schema_name = schema_name or self.SCHEMA_NAME
        key = cache.key(self.PREFIX, schema_name)
        schema = cache.get(key)
        if schema is not None:
            return jsonref.loads(schema)

        relative_path = os.path.join('schemas', '%s.json' % schema_name)
        absolute_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), relative_path
        )

        base_path = os.path.dirname(absolute_path)
        base_uri = 'file://{}/'.format(base_path)

        with open(absolute_path) as schema_file:
            schema = schema_file.read()
            cache.set(key, schema)
            return jsonref.loads(schema, base_uri=base_uri, jsonschema=True)

    def validate(self, data):
        data = self.pre_load(data)
        validate(data, self.schema, format_checker=FormatChecker())
        return data

    def pre_load(self, data):
        return data

    def flatten(self, data, target, source):
        """Move a nested object with an ID to a direct key."""
        data = ensure_dict(data)
        value = stringify(data.get(target))
        if value is None:
            value = stringify(ensure_dict(data.get(source)).get('id'))
        data[target] = value
        return data


class RoleSchema(Schema):
    SCHEMA_NAME = 'RoleSchema'


class RoleCodeCreateSchema(Schema):
    SCHEMA_NAME = 'RoleCodeCreateSchema'


class RoleCreateSchema(Schema):
    SCHEMA_NAME = 'RoleCreateSchema'


class LoginSchema(Schema):
    SCHEMA_NAME = 'LoginSchema'


class PermissionSchema(Schema):
    SCHEMA_NAME = 'PermissionSchema'

    def pre_load(self, data):
        return self.flatten(data, 'role_id', 'role')


class AlertSchema(Schema):
    SCHEMA_NAME = 'AlertSchema'


class XrefSchema(Schema):
    SCHEMA_NAME = 'XrefSchema'


class CollectionCreateSchema(Schema):
    SCHEMA_NAME = 'CollectionCreateSchema'


class CollectionUpdateSchema(Schema):
    SCHEMA_NAME = 'CollectionUpdateSchema'

    def pre_load(self, data):
        return self.flatten(data, 'creator_id', 'creator')


class EntityUpdateSchema(Schema):
    SCHEMA_NAME = 'EntityUpdateSchema'


class EntityCreateSchema(Schema):
    SCHEMA_NAME = 'EntityCreateSchema'

    def pre_load(self, data):
        return self.flatten(data, 'collection_id', 'collection')


class DocumentCreateSchema(Schema):
    SCHEMA_NAME = 'DocumentCreateSchema'

    def pre_load(self, data):
        return self.flatten(data, 'parent_id', 'parent')
