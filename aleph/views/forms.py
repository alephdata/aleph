import os

from jsonschema import validate
# import jsonref

from aleph.core import cache


class Schema():
    SCHEMA_NAME = None
    PREFIX = 'schema'

    def __init__(self, schema=None):
        self.schema = self.load_json_schema(schema_name=schema)

    def load_json_schema(self, schema_name=None):
        """Loads the given schema file"""
        schema_name = schema_name or self.SCHEMA_NAME
        key = cache.key(self.PREFIX, schema_name)
        schema = cache.get(key)
        if schema is not None:
            return jsonref.loads(schema)

        relative_path = os.path.join('schemas', '%s.json' % schema_name)
        absolute_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), relative_path
        )

        base_path = os.path.dirname(absolute_path)
        base_uri = 'file://{}/'.format(base_path)

        with open(absolute_path) as schema_file:
            schema = schema_file.read()
            cache.set(key, schema)
            return jsonref.loads(schema, base_uri=base_uri, jsonschema=True)

    def validate(self, data):
        data = self.pre_load(data)
        validate(data, self.schema, format_checker=FormatChecker())
        return data

    def pre_load(self, data):
        return data


class RoleSchema(Schema):
    SCHEMA_NAME = 'RoleSchema'


class RoleCodeCreateSchema(Schema):
    SCHEMA_NAME = 'RoleCodeCreateSchema'


class RoleCreateSchema(Schema):
    SCHEMA_NAME = 'RoleCreateSchema'


class LoginSchema(Schema):
    SCHEMA_NAME = 'LoginSchema'


class PermissionSchema(Schema):
    SCHEMA_NAME = 'PermissionSchema'

    def pre_load(self, data):
        return self.flatten(data, 'role_id', 'role')


class AlertSchema(Schema):
    SCHEMA_NAME = 'AlertSchema'


class XrefSchema(Schema):
    SCHEMA_NAME = 'XrefSchema'


class CollectionCreateSchema(Schema):
    SCHEMA_NAME = 'CollectionCreateSchema'


class CollectionUpdateSchema(Schema):
    SCHEMA_NAME = 'CollectionUpdateSchema'

    def pre_load(self, data):
        return self.flatten(data, 'creator_id', 'creator')


class EntityUpdateSchema(Schema):
    SCHEMA_NAME = 'EntityUpdateSchema'


class EntityCreateSchema(Schema):
    SCHEMA_NAME = 'EntityCreateSchema'

    def pre_load(self, data):
        return self.flatten(data, 'collection_id', 'collection')


class DocumentCreateSchema(Schema):
    SCHEMA_NAME = 'DocumentCreateSchema'

    def pre_load(self, data):
        return self.flatten(data, 'parent_id', 'parent')
