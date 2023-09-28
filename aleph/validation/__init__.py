import os
import yaml
import logging
from jsonschema import RefResolver, Draft4Validator
from apispec import APISpec
from apispec_webframeworks.flask import FlaskPlugin

from aleph import __version__
from aleph.settings import SETTINGS
from aleph.validation.formats import checker
from aleph.validation.spec import spec_info, spec_tags, spec_docs
from aleph.validation.util import to_jsonschema

URI = "https://schema.alephdata.org/"
SCHEMA_DIR = os.path.join(os.path.dirname(__file__), "schema")

log = logging.getLogger(__name__)


class ValidationException(Exception):
    def __init__(self, errors):
        self.errors = errors


def get_schemata():
    """Load all validation schemata and return a dict of them."""
    # Are being snobs about the plural of 'schema'?
    # Damn fucking right we are.
    schemata = {}
    for file_name in os.listdir(SCHEMA_DIR):
        file_path = os.path.join(SCHEMA_DIR, file_name)
        data = yaml.safe_load(open(file_path, "r"))
        schemata.update(data)
    return schemata


def get_openapi_spec(app):
    spec = APISpec(
        title="Aleph API Documentation",
        version=__version__,
        openapi_version="3.0.2",
        info=spec_info,
        externalDocs=spec_docs,
        tags=spec_tags,
        plugins=[FlaskPlugin()],
    )
    for name, spec_ in get_schemata().items():
        spec.components.schema(name, spec_)
    return spec


def get_resolver():
    if not hasattr(SETTINGS, "_json_resolver"):
        resolver = RefResolver(URI, {})
        schemata = get_schemata()
        resolver.store[URI] = {"components": {"schemas": to_jsonschema(schemata)}}
        SETTINGS._json_resolver = resolver
    return SETTINGS._json_resolver


def get_validator(schema):
    ref = "#/components/schemas/%s" % schema
    resolver = get_resolver()
    _, schema = resolver.resolve(ref)
    return Draft4Validator(schema, format_checker=checker, resolver=resolver)


def validate(data, schema):
    """Validate data against a schema and aggregate errors."""
    validator = get_validator(schema)
    errors = {}
    for error in validator.iter_errors(data):
        path = ".".join((str(c) for c in error.path))
        if path not in errors:
            errors[path] = error.message
        else:
            errors[path] += "; " + error.message
        log.info("ERROR [%s]: %s", path, error.message)

    if len(errors):
        raise ValidationException(errors)

    return data
