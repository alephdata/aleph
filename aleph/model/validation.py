import os
import json

from jsonschema import Draft4Validator, FormatChecker, RefResolver

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


@format_checker.checks('country-code')
def is_country_code(code):
    return code.lower() in COUNTRY_NAMES.keys()


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
