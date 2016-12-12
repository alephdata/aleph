import os
import re
import json
import socket
from jsonschema import Draft4Validator, FormatChecker, RefResolver

from aleph.core import get_config
from aleph.data.reference import COUNTRY_NAMES, LANGUAGE_NAMES

resolver = RefResolver('core.json#', {})

SCHEMA_DIR = os.path.join(os.path.dirname(__file__), 'validation')

for (root, dirs, files) in os.walk(SCHEMA_DIR):
    for schema_file in files:
        with open(os.path.join(root, schema_file), 'r') as fh:
            schema = json.load(fh)
            resolver.store[schema['id']] = schema

format_checker = FormatChecker()
# JS: '^([12]\\d{3}(-[01]?[1-9](-[0123]?[1-9])?)?)?$'
PARTIAL_DATE_RE = re.compile('^([12]\d{3}(-[01]?[0-9](-[0123]?[0-9])?)?)?$')


@format_checker.checks('country-code')
def is_country_code(code):
    if code is None:
        return False
    return code.lower() in COUNTRY_NAMES.keys()


@format_checker.checks('partial-date')
def is_partial_date(date):
    if date is None:
        return True
    return PARTIAL_DATE_RE.match(date) is not None


@format_checker.checks('language-code')
def is_language_code(code):
    if code is None:
        return False
    return code.lower() in LANGUAGE_NAMES.keys()


@format_checker.checks('url')
def is_url(url):
    from aleph.data.parse import parse_url
    return parse_url(url) is not None


@format_checker.checks('domain')
def is_domain(domain):
    """Validate an IDN compatible domain."""
    try:
        domain = domain.encode('idna').lower()
        socket.getaddrinfo(domain, None)
        return True
    except:
        return False


@format_checker.checks('collection-category')
def is_collection_category(cat):
    categories = get_config('COLLECTION_CATEGORIES', {})
    return cat in categories.keys()


def validate(data, schema):
    _, schema = resolver.resolve(schema)
    validator = Draft4Validator(schema, resolver=resolver,
                                format_checker=format_checker)
    return validator.validate(data, schema)
