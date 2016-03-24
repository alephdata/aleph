import os
import json
from datetime import datetime

from jsonschema import Draft4Validator, FormatChecker, RefResolver
from jsonmapping import SchemaVisitor
from jsonmapping.value import convert_value

from aleph.core import db
from aleph.model.common import DatedModel
from aleph.model.constants import COUNTRY_NAMES, LANGUAGE_NAMES
from aleph.model.constants import SOURCE_CATEGORIES, ENTITY_CATEGORIES


resolver = RefResolver('core.json#', {})

schema_dir = os.path.join(os.path.dirname(__file__), '..', 'schema')
for (root, dirs, files) in os.walk(schema_dir):
    for schema_file in files:
        with open(os.path.join(root, schema_file), 'r') as fh:
            schema = json.load(fh)
            resolver.store[schema['id']] = schema
            print schema_file, schema['id']

format_checker = FormatChecker()


@format_checker.checks('country-code')
def is_country_code(code):
    return code in COUNTRY_NAMES.keys()


@format_checker.checks('language-code')
def is_language_code(code):
    return code in LANGUAGE_NAMES.keys()


@format_checker.checks('source-category')
def is_source_category(cat):
    return cat in SOURCE_CATEGORIES.keys()


@format_checker.checks('entity-category')
def is_entity_category(cat):
    return cat in ENTITY_CATEGORIES.keys()


def validate(data, schema):
    _, schema = resolver.resolve(schema)
    validator = Draft4Validator(schema, resolver=resolver,
                                format_checker=format_checker)
    return validator.validate(data, schema)


class SchemaModel(object):
    _schema = None

    @property
    def schema_data(self):
        if self._schema is None:
            raise NotImplementedError('No _schema on: %r' % self)
        _, schema = resolver.resolve(self._schema)
        return schema

    @property
    def schema_visitor(self):
        return SchemaVisitor(self.schema_data, resolver)

    def schema_update(self, data):
        validate(data, self._schema)
        for prop in self.schema_visitor.properties:
            if prop.name == 'id':
                continue
            if prop.name not in data:
                continue
            if not prop.is_value:
                continue
            # TODO: type-casting
            value = convert_value(prop, data[prop.name])
            setattr(self, prop.name, value)
        if isinstance(self, DatedModel):
            self.updated_at = datetime.utcnow()
        db.session.add(self)
