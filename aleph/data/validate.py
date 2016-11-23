import os
import re
import json
from jsonschema import Draft4Validator, FormatChecker, RefResolver
from jsonmapping import SchemaVisitor

from aleph.core import get_config
from aleph.reference import is_country_code, is_language_code
from aleph.metadata.parsers import parse_url

resolver = RefResolver('core.json#', {})

SCHEMA_DIR = os.path.join(os.path.dirname(__file__), 'validation')

for (root, dirs, files) in os.walk(SCHEMA_DIR):
    for schema_file in files:
        with open(os.path.join(root, schema_file), 'r') as fh:
            schema = json.load(fh)
            resolver.store[schema['id']] = schema

format_checker = FormatChecker()
# JS: '^([12]\\d{3}(-[01]?[1-9](-[0123]?[1-9])?)?)?$'
partial_date_re = re.compile('^([12]\d{3}(-[01]?[0-9](-[0123]?[0-9])?)?)?$')


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
    categories = get_config('COLLECTION_CATEGORIES', {})
    return cat in categories.keys()


def validate(data, schema):
    _, schema = resolver.resolve(schema)
    validator = Draft4Validator(schema, resolver=resolver,
                                format_checker=format_checker)
    return validator.validate(data, schema)
