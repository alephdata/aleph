import logging
import fingerprints
from hashlib import sha1
from pprint import pprint  # noqa
from banal import unique_list

from aleph.core import schemata
from aleph.schema import Schema
from aleph.util import dict_list
from aleph.text import string_value
from datetime import datetime
from aleph.logic.bulk.formatting import Formatter
from aleph.index.entities import finalize_index

log = logging.getLogger(__name__)


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
        values = [self.schema.type.clean(v, record, self.data) for v in values]
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

        self.schema = schemata.get(data.get('schema'))
        if self.schema is None or self.schema.section != self.section:
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
        digest = sha1(self.query.collection.foreign_id.encode('utf-8'))
        has_key = False
        for key in self.keys:
            value = record.get(key)
            if self.key_fingerprint:
                value = fingerprints.generate(value)
            else:
                value = string_value(value)
            if value is None:
                continue
            digest.update(value.encode('utf-8'))
            has_key = True
        if has_key:
            return digest.hexdigest()

    def to_index(self, record):
        now = datetime.utcnow()
        return {
            'collection_id': self.query.collection.id,
            'roles': self.query.roles,
            'properties': self.compute_properties(record),
            'created_at': now,
            'updated_at': now,
            '$bulk': True
        }

    def __repr__(self):
        return '<Mapper(%r)>' % self.query


class EntityMapper(Mapper):
    section = Schema.ENTITY

    def __init__(self, query, name, data):
        self.name = name
        super(EntityMapper, self).__init__(query, data)
        if not len(self.keys):
            log.warning("No key criteria defined: %r", data)

    def to_index(self, record):
        data = super(EntityMapper, self).to_index(record)
        data['id'] = self.compute_key(record)
        if data['id'] is None:
            return
        return finalize_index(data, self.schema)


class LinkMapper(Mapper):
    section = Schema.LINK

    def __init__(self, query, data):
        super(LinkMapper, self).__init__(query, data)

    def to_index(self, record, entities, inverted=False):
        data = super(LinkMapper, self).to_index(record)
        data['inverted'] = inverted

        source, target = self.data.get('source'), self.data.get('target')
        origin, remote = entities.get(source), entities.get(target)
        if inverted:
            origin, remote = remote, origin

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
        # this is expanded post entity indexing.
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
        return finalize_index(data, self.schema)
