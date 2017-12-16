from followthemoney import model
from exactitude import countries, languages, dates
from marshmallow import Schema
from marshmallow.fields import String, Raw, Float
from marshmallow.exceptions import ValidationError

from aleph.core import get_config


class Category(String):
    """A category of collections, e.g. leaks, court cases, sanctions list."""

    def _validate(self, value):
        categories = get_config('COLLECTION_CATEGORIES', {})
        if value not in categories.keys():
            raise ValidationError('Invalid category.')


class Language(String):
    """A valid language code."""

    def _validate(self, value):
        if not languages.validate(value):
            raise ValidationError('Invalid language code.')


class Country(String):
    """A valid country code."""

    def _validate(self, value):
        if not countries.validate(value):
            raise ValidationError('Invalid country code: %s' % value)


class PartialDate(String):
    """Any valid prefix of an ISO 8601 datetime string."""

    def _validate(self, value):
        if not dates.validate(value):
            raise ValidationError('Invalid date: %s' % value)


class SchemaName(String):

    def _validate(self, value):
        schema = model.get(value)
        if schema is None:
            raise ValidationError('Invalid schema name: %s' % value)


class BaseSchema(Schema):
    EXPAND = []

    id = String(dump_only=True)
    score = Float(dump_only=True)
    highlight = String(dump_only=True)

    # these are raw because dumping fails if the dates are already strings, as
    # in the case of data coming from the ES index.
    created_at = Raw(dump_only=True)
    updated_at = Raw(dump_only=True)
