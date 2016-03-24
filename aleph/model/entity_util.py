from aleph.util import find_subclasses


class SchemaDispatcher(object):

    @classmethod
    def get_schema_class(cls, schema):
        if cls._schema == schema:
            return cls
        for subcls in find_subclasses(cls):
            if subcls._schema == schema:
                return subcls
