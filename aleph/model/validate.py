import os
import json
from dalet import is_country_code, is_partial_date, is_language_code
from dalet import is_domain, is_url
from jsonschema import Draft4Validator, FormatChecker, RefResolver

from aleph.core import get_config

resolver = RefResolver('core.json#', {})

SCHEMA_DIR = os.path.join(os.path.dirname(__file__), 'validation')

for (root, dirs, files) in os.walk(SCHEMA_DIR):
    for schema_file in files:
        with open(os.path.join(root, schema_file), 'r') as fh:
            schema = json.load(fh)
            resolver.store[schema['id']] = schema

format_checker = FormatChecker()
format_checker.checks('country-code')(is_country_code)
format_checker.checks('partial-date')(is_partial_date)
format_checker.checks('language-code')(is_language_code)
format_checker.checks('url')(is_url)
format_checker.checks('domain')(is_domain)


@format_checker.checks('collection-category')
def is_collection_category(cat):
    categories = get_config('COLLECTION_CATEGORIES', {})
    return cat in categories.keys()


def validate(data, schema):
    _, schema = resolver.resolve(schema)
    validator = Draft4Validator(schema, resolver=resolver,
                                format_checker=format_checker)
    return validator.validate(data, schema)
