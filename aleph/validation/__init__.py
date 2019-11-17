import os
import yaml
import logging
from jsonschema import RefResolver
from apispec import APISpec
from apispec_webframeworks.flask import FlaskPlugin

from aleph import __version__

URI = 'https://schema.alephdata.org/'
SCHEMA_DIR = os.path.join(os.path.dirname(__file__), 'schema')

log = logging.getLogger(__name__)
spec = APISpec(
    title="aleph",
    version=__version__,
    openapi_version="3.0.2",
    # info=dict(description="A minimal gist API"),
    plugins=[FlaskPlugin()],
)
resolver = RefResolver(URI, {})


def validate(data, ref):
    pass


if __name__ == '__main__':
    from pprint import pprint
    from aleph.core import create_app
    app = create_app()
    with app.app_context():
        for view in app.view_functions.values():
            # print(view, type(view))
            spec.path(view=view)

        schemata = {}
        for file_name in os.listdir(SCHEMA_DIR):
            # print(file_name)
            file_path = os.path.join(SCHEMA_DIR, file_name)
            # print(file_path)
            data = yaml.safe_load(open(file_path, 'r'))
            schemata.update(data)
            for name, spec_ in data.items():
                spec.components.schema(name, spec_)

        pprint(spec.to_dict())
        resolver.store[URI] = {
            'components': {
                'schemas': schemata
            }
        }
        # pprint(resolver.store)
        # pprint(resolver.resolve('#/components/schemas/Alert'))

