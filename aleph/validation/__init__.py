import os
import yaml
import logging
from normality import stringify
from banal import is_mapping, ensure_dict
from jsonschema import RefResolver, Draft4Validator
from apispec import APISpec
from apispec_webframeworks.flask import FlaskPlugin

from aleph import settings, __version__
from aleph.validation.formats import checker
from aleph.validation.util import to_jsonschema

URI = 'https://schema.alephdata.org/'
SCHEMA_DIR = os.path.join(os.path.dirname(__file__), 'schema')

log = logging.getLogger(__name__)


def flatten_nested(data, target, source):
    """Move a nested object with an ID to a direct key."""
    if not is_mapping(data):
        return data
    data = ensure_dict(data)
    source = ensure_dict(data.pop(source, None))
    value = data.get(target)
    if value is None:
        value = stringify(source.get('id'))
    data[target] = value
    return data


def get_schemata():
    """Load all validation schemata and return a dict of them."""
    # Are being snobs about the plural of 'schema'?
    # Damn fucking right we are.
    schemata = {}
    for file_name in os.listdir(SCHEMA_DIR):
        file_path = os.path.join(SCHEMA_DIR, file_name)
        data = yaml.safe_load(open(file_path, 'r'))
        schemata.update(data)
    return schemata


def get_openapi_spec(app):
    spec = APISpec(
        title="aleph",
        version=__version__,
        openapi_version="3.0.2",
        # info=dict(description="A minimal gist API"),
        plugins=[FlaskPlugin()],
    )
    for name, spec_ in get_schemata().items():
        spec.components.schema(name, spec_)
    return spec


def get_resolver():
    if not hasattr(settings, '_json_resolver'):
        resolver = RefResolver(URI, {})
        schemata = get_schemata()
        resolver.store[URI] = {
            'components': {
                'schemas': to_jsonschema(schemata)
            }
        }
        settings._json_resolver = resolver
    return settings._json_resolver


def get_validator(schema):
    ref = '#/components/schemas/%s' % schema
    resolver = get_resolver()
    _, schema = resolver.resolve(ref)
    return Draft4Validator(schema,
                           format_checker=checker,
                           resolver=resolver)
