from banal import is_mapping
from normality import stringify
from followthemoney import model
from followthemoney.types import registry
from marshmallow.fields import String, Raw, Float
from marshmallow.exceptions import ValidationError

from aleph.model import Collection
from aleph.serializers.expand import ExpandableSchema


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


class BaseSchema(ExpandableSchema):
    id = String(dump_only=True)
    score = Float(dump_only=True)
    highlight = Raw(dump_only=True)

    # these are raw because dumping fails if the dates are already strings, as
    # in the case of data coming from the ES index.
    created_at = Raw(dump_only=True)
    updated_at = Raw(dump_only=True)


def flatten_id(data, field, nested):
    if not is_mapping(data):
        return data
    value = stringify(data.get(field))
    if value is None:
        nested = data.get(nested)
        if is_mapping(nested):
            value = stringify(nested.get('id'))
    data[field] = value
