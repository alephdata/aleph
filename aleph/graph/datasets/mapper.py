import six
import fingerprints
from hashlib import sha1
from pprint import pprint  # noqa

from aleph.graph.schema import Schema
from aleph.graph.datasets.formatting import Formatter
from aleph.util import dict_list, unique_list
from aleph.text import latinize_text, clean_text


class MapperProperty(object):

    def __init__(self, mapper, name, data, schema):
        self.mapper = mapper
        self.name = name
        self.data = data
        self.schema = schema
        self.refs = dict_list(data, 'column', 'columns')
        self.literals = dict_list(data, 'literal', 'literals')
        self.join = data.get('join')

        # this is hacky, trying to generate refs from template
        self.template = data.get('template')
        if self.template is not None:
            self.formatter = Formatter(self.template)
            self.refs.extend(self.formatter.refs)

    def get_values(self, record):
        values = []
        if self.template is not None:
            values.append(self.formatter.apply(record))
        else:
            for ref in self.refs:
                values.append(record.get(ref))
        values.extend(self.literals)
        values = [self.schema.type.clean(v, self, record) for v in values]
        values = [v for v in values if v is not None]

        if self.join is not None:
            values = [self.join.join(values)]

        return unique_list(values)

    def __repr__(self):
        return '<MapperProperty(%r, %r, %r)>' % (self.mapper, self.name,
                                                 self.schema)


class Mapper(object):

    def __init__(self, query, data):
        self.query = query
        self.data = data
        self.keys = dict_list(data, 'keys', 'key')
        self.key_fingerprint = data.get('key_fingerprint', False)

        model = query.dataset.model
        self.schema = model.get_schema(self.section, data.get('schema'))
        if self.schema is None:
            raise TypeError("Invalid schema: %r" % data.get('schema'))

        self.properties = []
        for name, prop in data.get('properties', {}).items():
            schema = self.schema.get(name)
            self.properties.append(MapperProperty(self, name, prop, schema))

    @property
    def refs(self):
        for key in self.keys:
            yield key
        for prop in self.properties:
            for ref in prop.refs:
                yield ref

    def compute_properties(self, record):
        return {p.name: p.get_values(record) for p in self.properties}

    def compute_key(self, record):
        if not len(self.keys):
            return None
        digest = sha1(self.query.dataset.name.encode('utf-8'))
        # digest.update(self.schema.name.encode('utf-8'))
        has_key = False
        for key in self.keys:
            value = record.get(key)
            if self.key_fingerprint:
                value = fingerprints.generate(value)
            else:
                value = clean_text(value)
            if value is None:
                continue
            digest.update(value.encode('utf-8'))
            has_key = True
        if has_key:
            return digest.hexdigest()

    def to_index(self, record):
        text = set()
        properties = self.compute_properties(record)

        for value in properties.values() + record.values():
            if isinstance(value, six.string_types) and len(value.strip()) > 1:
                text.add(value)
                text.add(latinize_text(value))

        schemata = []
        for schema in self.schema.schemata:
            if not schema.is_hidden:
                schemata.append(schema.name)

        return {
            'schema': self.schema.name,
            'schemata': schemata,
            'dataset': self.query.dataset.name,
            'groups': self.query.dataset.groups,
            'properties': properties,
            'text': list(text)
        }

    def __repr__(self):
        return '<Mapper(%r)>' % self.query


class EntityMapper(Mapper):
    section = Schema.ENTITY

    def __init__(self, query, name, data):
        self.name = name
        super(EntityMapper, self).__init__(query, data)

        if not len(self.keys):
            raise TypeError("No key column(s) defined: %s" % name)

    def to_index(self, record):
        data = super(EntityMapper, self).to_index(record)
        properties = data['properties']
        data['id'] = self.compute_key(record)
        if not data['id']:
            return

        for prop in self.properties:
            values = properties.get(prop.name)

            # Find an set the name property
            if prop.schema.is_label and len(values):
                data['name'] = values[0]

            # Add inverted properties. This takes all the properties
            # of a specific type (names, dates, emails etc.)
            type_ = prop.schema.type
            if type_.index_invert:
                if type_.index_invert not in data:
                    data[type_.index_invert] = []
                for norm in type_.normalize(values, prop, record):
                    if norm not in data[type_.index_invert]:
                        data[type_.index_invert].append(norm)

        return data


class LinkMapper(Mapper):
    section = Schema.LINK

    def __init__(self, query, data):
        super(LinkMapper, self).__init__(query, data)

    def to_index(self, record, entities, inverted=False):
        data = super(LinkMapper, self).to_index(record)
        data['inverted'] = inverted

        source, target = self.data.get('source'), self.data.get('target')
        if inverted:
            origin, remote = entities.get(target), entities.get(source)
        else:
            origin, remote = entities.get(source), entities.get(target)

        if origin is None or remote is None:
            # If data was missing for either the source or target entity
            # they will be None, and we should not create a link.
            return

        # We don't need to index the entity here, since it's already known
        # in the simplest case (entity profile pages).
        data['origin'] = {
            'id': origin.get('id'),
            'fingerprints': origin.get('fingerprints'),
        }
        data['text'].extend(remote.get('text', []))
        data['remote'] = remote.get('id')

        # Generate a link ID
        digest = sha1()
        digest.update(str(inverted))
        digest.update(origin['id'])
        digest.update(remote['id'])
        key_digest = self.compute_key(record)
        if key_digest is not None:
            digest.update(key_digest)
        data['id'] = digest.hexdigest()
        return data
