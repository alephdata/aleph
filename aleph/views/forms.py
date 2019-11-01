import abc

from banal import ensure_dict
from normality import stringify
from flask_babel import gettext
from urlnormalizer import normalize_url
from followthemoney import model
from followthemoney.types import registry
from jsonschema import FormatChecker, validate

from aleph import settings
from aleph.model import Collection


MIN_PASSWORD_LENGTH = 6


def flatten(data, target, source):
    """Move a nested object with an ID to a direct key."""
    data = ensure_dict(data)
    value = stringify(data.get(target))
    if value is None:
        value = stringify(ensure_dict(data.get(source)).get('id'))
    data[target] = value
    return data


@FormatChecker.cls_checks("locale", raises=ValueError)
def check_locale(value):
    if value not in settings.UI_LANGUAGES:
        raise ValueError(gettext('Invalid user locale.'))
    return True


@FormatChecker.cls_checks("country", raises=ValueError)
def check_country_code(value):
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
    if value is not None and normalize_url(value) is None:
        raise ValueError(gettext('Invalid URL.'))
    return True


@FormatChecker.cls_checks("language", raises=ValueError)
def check_language(value):
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


def deserialize_locale(value):
    return stringify(value)


def deserialize_url(value):
    return stringify(value)


def deserialize_language(value):
    return registry.language.clean(value)


def deserialize_country(value):
    return registry.country.clean(value)


class Schema(abc.ABC):
    FORMAT_DESERIALIZERS = {
        "locale": deserialize_locale,
        "url": deserialize_url,
        "language": deserialize_language,
        "country": deserialize_country,
    }

    def __init__(self, data):
        self.data = data

    @property
    @abc.abstractmethod
    def schema(self):
        pass

    def pre_load(self):
        return self.data

    def deserialize(self, data):
        props = self.schema["properties"]
        for prop, val in props.items():
            format_ = val.get("format")
            if format_ is not None:
                deserializer = self.FORMAT_DESERIALIZERS.get(format_)
                if deserializer and data.get(prop, None) is not None:
                    data[prop] = deserializer(data[prop])
        return data

    def validate(self):
        data = self.pre_load()
        validate(data, self.schema, format_checker=FormatChecker())
        return self.deserialize(data)


class RoleSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "minLength": 4
                },
                "is_muted": {
                    "type": "boolean"
                },
                "password": {
                    "type": "string",
                    "minLength": MIN_PASSWORD_LENGTH,
                },
                "current_password": {
                    "type": "string",
                },
                "locale": {
                    "type": ["string", "null"],
                    "format": "locale"
                }
            }
        }


class RoleCodeCreateSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "email": {
                    "type": "string",
                    "format": "email"
                }
            }
        }


class RoleCreateSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "minLength": 4,
                },
                "password": {
                    "type": "string",
                    "minLength": MIN_PASSWORD_LENGTH,
                },
                "code": {
                    "type": "string",
                },
            }
        }


class LoginSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "email": {
                    "type": "string",
                    "format": "email",
                },
                "password": {
                    "type": "string",
                    "minLength": 3,
                }
            }
        }


class PermissionSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "write": {
                    "type": "boolean",
                },
                "read": {
                    "type": "boolean",
                },
                "role_id": {
                    "type": "string",
                }
            },
            "required": ["write", "read", "role_id"],
        }

    def pre_load(self):
        return flatten(self.data, 'role_id', 'role')


class AlertSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "query": {"type": "string"}
            },
            "required": ["query"]
        }


class XrefSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "against_collection_ids": {
                    "type": "array",
                    "items": {
                        "type": "integer",
                        "minimum": 1
                    }
                }
            }
        }


class CollectionCreateSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "label": {
                    "type": "string",
                    "minLength": 2,
                    "maxLength": 500,
                },
                "foreign_id": {
                    "type": "string",
                },
                "summary": {
                    "type": ["string", "null"],
                },
                "publisher": {
                    "type": ["string", "null"],
                },
                "publisher_url": {
                    "type": ["string", "null"],
                    "format": "url",
                },
                "data_url": {
                    "type": ["string", "null"],
                    "format": "url",
                },
                "info_url": {
                    "type": ["string", "null"],
                    "format": "url",
                },
                "countries": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "format": "country",
                    }
                },
                "languages": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "format": "language",
                    }
                },
                "category": {
                    "type": "string",
                    "format": "category",
                }
            },
            "required": ["label"],
        }


class CollectionUpdateSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "label": {
                    "type": "string",
                    "minLength": 2,
                    "maxLength": 500,
                },
                "foreign_id": {
                    "type": "string",
                },
                "summary": {
                    "type": "string",
                },
                "publisher": {
                    "type": "string",
                },
                "publisher_url": {
                    "type": "string",
                    "format": "url",
                },
                "data_url": {
                    "type": "string",
                    "format": "url",
                },
                "info_url": {
                    "type": "string",
                    "format": "url",
                },
                "countries": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "format": "country",
                    }
                },
                "languages": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "format": "language",
                    }
                },
                "category": {
                    "type": "string",
                    "format": "category",
                },
                "creator_id": {
                    "type": ["string", "null"],
                }
            },
            "required": ["label"],
        }

    def pre_load(self):
        return flatten(self.data, 'creator_id', 'creator')


class EntityUpdateSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "schema": {
                    "type": "string",
                    "format": "schema",
                },
                "properties": {
                    "type": "object"
                }
            }
        }


class EntityCreateSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "schema": {
                    "type": "string",
                    "format": "schema",
                },
                "properties": {
                    "type": "object"
                },
                "foreign_id": {
                    "type": "string",
                },
                "collection_id": {
                    "type": "string"
                }
            },
            "required": ["collection_id"]
        }

    def pre_load(self):
        return flatten(self.data, 'collection_id', 'collection')


class DocumentCreateSchema(Schema):
    @property
    def schema(self):
        return {
            "type": "object",
            "properties": {
                "title": {
                    "type": ["string", "null"],
                },
                "summary": {
                    "type": ["string", "null"],
                },
                "countries": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "format": "country",
                    }
                },
                "languages": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "format": "language",
                    }
                },
                "keywords": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "minLength": 0,
                        "maxLength": 5000,  # TODO: seems excessive?
                    }
                },
                "date": {
                    "type": ["string", "null"],
                    "format": "partial-date"
                },
                "authored_at": {
                    "type": ["string", "null"],
                    "format": "partial-date"
                },
                "modified_at": {
                    "type": ["string", "null"],
                    "format": "partial-date"
                },
                "published_at": {
                    "type": ["string", "null"],
                    "format": "partial-date"
                },
                "retrieved_at": {
                    "type": ["string", "null"],
                    "format": "partial-date"
                },
                "filename": {
                    "type": ["string", "null"],
                },
                "author": {
                    "type": ["string", "null"]
                },
                "generator": {
                    "type": ["string", "null"]
                },
                "crawler": {
                    "type": ["string", "null"]
                },
                "mime_type": {
                    "type": ["string", "null"]
                },
                "source_url": {
                    "type": ["string", "null"]
                },
                "parent_id": {
                    "type": ["string", "null"]
                }
            },
            "required": ["collection_id"]
        }

    def pre_load(self):
        return flatten(self.data, 'parent_id', 'parent')
