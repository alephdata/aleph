import os
import re
import json

from jsonschema import Draft4Validator, FormatChecker, RefResolver
from jsonmapping import SchemaVisitor

from aleph.metadata.parsers import parse_url
from aleph.metadata.reference import is_country_code, is_language_code


resolver = RefResolver('core.json#', {})

schema_dir = os.path.join(os.path.dirname(__file__), '..', 'schema')
for (root, dirs, files) in os.walk(schema_dir):
    for schema_file in files:
        with open(os.path.join(root, schema_file), 'r') as fh:
            schema = json.load(fh)
            resolver.store[schema['id']] = schema

format_checker = FormatChecker()
# JS: '^([12]\\d{3}(-[01]?[1-9](-[0123]?[1-9])?)?)?$'
partial_date_re = re.compile('^([12]\d{3}(-[01]?[1-9](-[0123]?[1-9])?)?)?$')


@format_checker.checks('country-code')
def country_code(code):
    return is_country_code(code)


@format_checker.checks('partial-date')
def is_partial_date(date):
    if date is None:
        return True
    return partial_date_re.match(date) is not None


@format_checker.checks('language-code')
def language_code(code):
    return is_language_code(code)


@format_checker.checks('url')
def valid_url(url):
    return parse_url(url) is not None


@format_checker.checks('collection-category')
def is_collection_category(cat):
    from aleph.model.collection import Collection
    return cat in Collection.CATEGORIES.keys()


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
    if schema_uri is None or not len(schema_uri.strip()):
        return []
    schemas = set([schema_uri])
    for uri, data in resolver.store.items():
        if isinstance(data, dict):
            visitor = SchemaVisitor(data, resolver)
            if _check_schema_match(visitor, schema_uri):
                schemas.add(data.get('id'))
    return list(schemas)
