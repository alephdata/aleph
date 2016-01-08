import os
import json

from jsonschema import Draft4Validator, FormatChecker, RefResolver

resolver = RefResolver('https://aleph.grano.cc/', {})

schema_dir = os.path.join(os.path.dirname(__file__), 'schema')
for schema_file in os.listdir(schema_dir):
    with open(os.path.join(schema_dir, schema_file), 'r') as fh:
        schema = json.load(fh)
        if 'id' in schema:
            resolver.store[schema['id']] = schema

format_checker = FormatChecker()


# @format_checker.checks('country-code')
# def is_country_code(code):
#     if code is None or not len(code.strip()):
#         return False
#     return code in get_countries().keys()


def validate(data, schema):
    _, schema = resolver.resolve(schema)
    validator = Draft4Validator(schema, resolver=resolver,
                                format_checker=format_checker)
    return validator.validate(data, schema)
