import os
import re
import json

from jsonschema import Draft4Validator, FormatChecker, RefResolver
from jsonmapping import SchemaVisitor

from aleph.model.constants import COUNTRY_NAMES, LANGUAGE_NAMES
from aleph.model.constants import SOURCE_CATEGORIES


resolver = RefResolver('core.json#', {})

schema_dir = os.path.join(os.path.dirname(__file__), '..', 'schema')
for (root, dirs, files) in os.walk(schema_dir):
    for schema_file in files:
        with open(os.path.join(root, schema_file), 'r') as fh:
            schema = json.load(fh)
            resolver.store[schema['id']] = schema

format_checker = FormatChecker()
# JS: '^([12]\\d{3}(-[01]?[1-9](-[0123]?[1-9])?)?)?$'
date_re = re.compile('^([12]\d{3}(-[01]?[1-9](-[0123]?[1-9])?)?)?$')


@format_checker.checks('country-code')
def is_country_code(code):
    return code.lower() in COUNTRY_NAMES.keys()


@format_checker.checks('partial-date')
def is_partial_date(date):
    if date is None:
        return True
    return date_re.match(date) is not None


@format_checker.checks('language-code')
def is_language_code(code):
    return code.lower() in LANGUAGE_NAMES.keys()


@format_checker.checks('source-category')
def is_source_category(cat):
    return cat in SOURCE_CATEGORIES.keys()


def validate(data, schema):
    _, schema = resolver.resolve(schema)
    validator = Draft4Validator(schema, resolver=resolver,
                                format_checker=format_checker)
    return validator.validate(data, schema)


def _check_schema_match(visitor, schema_uri):
    if visitor.id == schema_uri:
        return True
    for parent in visitor.inherited:
        if _check_schema_match(parent, schema_uri):
            return True
    return False


def implied_schemas(schema_uri):
    # Given a schema URI, return a list of implied (i.e. child) schema URIs,
    # with the original schema included.
    schemas = [schema_uri]
    for uri, data in resolver.store.items():
        if isinstance(data, dict):
            visitor = SchemaVisitor(data, resolver)
            if _check_schema_match(visitor, schema_uri):
                schemas.append(data.get('id'))
    return schemas
