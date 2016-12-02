from aleph.util import dict_list
from aleph.schema.types import resolve_type


class SchemaProperty(object):

    def __init__(self, schema, name, data):
        self.schema = schema
        self.name = name.strip()
        self.data = data
        self.label = data.get('label', name)
        self.is_hidden = data.get('hidden', False)
        self.is_label = name == 'name'
        cls = resolve_type(data.get('type', 'string'))
        self.type = cls()

    def __repr__(self):
        return '<SchemaProperty(%r, %r)>' % (self.schema, self.name)


class Schema(object):
    """Defines the abstract data model.

    Schema items define the entities and links available in the model.
    """

    ENTITY = 'entities'
    LINK = 'links'
    SECTIONS = [ENTITY, LINK]

    def __init__(self, model, section, name, data):
        assert section in self.SECTIONS, section
        self.model = model
        self.section = section
        self.name = name
        self.data = data
        self.label = data.get('label', name)
        self.icon = data.get('icon')
        self.is_hidden = data.get('hidden', False)
        self._extends = dict_list(data, 'extends')
        self._own_properties = []
        for name, prop in data.get('properties', {}).items():
            self._own_properties.append(SchemaProperty(self, name, prop))

        if section == self.LINK:
            # links only:
            self.forward = data.get('forward', self.label)
            self.reverse = data.get('reverse', self.label)

    @property
    def extends(self):
        """Return the inherited schemata."""
        for base in self._extends:
            yield self.model.get_schema(self.section, base)

    @property
    def schemata(self):
        """Return the full inheritance chain."""
        yield self
        for base in self.extends:
            for schema in base.schemata:
                yield schema

    @property
    def properties(self):
        """Return properties, those defined locally and in ancestors."""
        for prop in self._own_properties:
            yield prop
        for schema in self.extends:
            for prop in schema.properties:
                yield prop

    def get(self, name):
        for prop in self.properties:
            if prop.name == name:
                return prop
        raise ValueError("[%r] missing property: %s" % (self, name))

    def __repr__(self):
        return '<Schema(%r)>' % self.name


class SchemaSet(object):
    """A collection of schemata."""

    def __init__(self, data):
        self.schemata = []
        for section in Schema.SECTIONS:
            for name, sconfig in data.get(section, {}).items():
                self.schemata.append(Schema(self, section, name, sconfig))

    def get(self, section, name):
        for schema in self.schemata:
            if schema.section == section and schema.name == name:
                return schema
        raise TypeError("No such schema for %s: %s" % (section, name))

    def merge_entity_schema(self, left, right):
        if left == right:
            return left
        lefts = self.get(Schema.ENTITY, left)
        lefts = [s.name for s in lefts.schemata]
        if right in lefts:
            return left

        rights = self.get(Schema.ENTITY, right)
        rights = [s.name for s in rights.schemata]
        if left in rights:
            return right

        for left in lefts:
            for right in rights:
                if left == right:
                    return left

    # def __iter__(self):
    #     return iter(self.schemata)

    def __repr__(self):
        return '<SchemaSet(%r)>' % self.schemata
