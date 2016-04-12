import os
import json
from datetime import datetime

from jsonschema import Draft4Validator, FormatChecker, RefResolver
from jsonmapping import SchemaVisitor
from jsonmapping.value import convert_value

from aleph.core import db
from aleph.model.common import DatedModel
from aleph.model.constants import COUNTRY_NAMES, LANGUAGE_NAMES
from aleph.model.constants import SOURCE_CATEGORIES, ENTITY_CATEGORIES


resolver = RefResolver('core.json#', {})

schema_dir = os.path.join(os.path.dirname(__file__), '..', 'schema')
for (root, dirs, files) in os.walk(schema_dir):
    for schema_file in files:
        with open(os.path.join(root, schema_file), 'r') as fh:
            schema = json.load(fh)
            resolver.store[schema['id']] = schema

format_checker = FormatChecker()


@format_checker.checks('country-code')
def is_country_code(code):
    return code in COUNTRY_NAMES.keys()


@format_checker.checks('language-code')
def is_language_code(code):
    return code in LANGUAGE_NAMES.keys()


@format_checker.checks('source-category')
def is_source_category(cat):
    return cat in SOURCE_CATEGORIES.keys()


@format_checker.checks('entity-category')
def is_entity_category(cat):
    return cat in ENTITY_CATEGORIES


def validate(data, schema):
    _, schema = resolver.resolve(schema)
    validator = Draft4Validator(schema, resolver=resolver,
                                format_checker=format_checker)
    return validator.validate(data, schema)


class SchemaModel(object):
    """Reflect operations for entity updates from a JSON schema."""

    _schema = None
    _schema_recurse = False

    @property
    def schema_data(self):
        if self._schema is None:
            raise NotImplementedError('No _schema on: %r' % self)
        _, schema = resolver.resolve(self._schema)
        return schema

    @property
    def schema_visitor(self):
        return SchemaVisitor(self.schema_data, resolver)

    def schema_update(self, data):
        """Update the object based on JSON schema properties."""
        validate(data, self._schema)
        db.session.add(self)
        for prop in self.schema_visitor.properties:
            if prop.name == 'id':
                continue
            if prop.name not in data:
                continue
            prop_data = data[prop.name]
            if prop.is_value:
                self._schema_update_value(prop, prop_data)
            elif prop.is_object:
                self._schema_update_object(prop, prop_data)
            elif prop.is_array:
                self._schema_update_array(prop, prop_data)
        if isinstance(self, DatedModel):
            self.updated_at = datetime.utcnow()
        db.session.add(self)

    def _schema_update_value(self, prop, data):
        value = convert_value(prop, data)
        setattr(self, prop.name, value)

    def _get_property_by_column(self, column):
        """Given a model column, find its mapped property name."""
        for prop in self.__mapper__.iterate_properties:
            if hasattr(prop, 'columns'):
                if column in prop.columns:
                    return prop.key

    def _get_associations(self, obj, rel):
        """Return both column names for the association."""
        for local_col, remote_col in rel.prop.local_remote_pairs:
            local = self._get_property_by_column(local_col)
            remote = obj._get_property_by_column(remote_col)
            yield local, remote

    def _get_relationship(self, name, direction):
        """Get relationship metadata related to a given property."""
        rel = getattr(type(self), name)
        if rel.prop.direction.name != direction:
            raise TypeError("Not a %s relationship!" % direction)
        if not issubclass(rel.mapper.class_, SchemaModel):
            raise TypeError("Associated class is not a SchemaModel!")
        return rel

    def _schema_update_object(self, prop, data):
        rel = self._get_relationship(prop.name, 'MANYTOONE')

        obj = getattr(self, prop.name)
        if obj is None:
            # Create if does not exist.
            if data is None:
                return
            obj = rel.mapper.class_()

        # Update or delete.
        if data is not None:
            obj.update(data)
            db.session.flush()
        else:
            obj.delete()

        # Link up primary and foreign key.
        for local, remote in self._get_associations(obj, rel):
            value = getattr(obj, remote)
            if data is None:
                value = None
            setattr(self, local, value)
        return obj

    def _schema_update_array(self, prop, data):
        rel = self._get_relationship(prop.name, 'ONETOMANY')
        cls = rel.mapper.class_
        existing = list(getattr(self, prop.name))
        ids = set()

        for item in data or []:
            if item is None:
                continue
            obj = cls.by_id(item.get('id')) or cls()
            obj.update(item)
            db.session.flush()
            ids.add(obj.id)
            existing.append(obj)

        for obj in existing:
            if obj.id not in ids:
                obj.delete()
                continue

            for local, remote in self._get_associations(obj, rel):
                setattr(obj, remote, getattr(self, local))

        setattr(self, prop.name, existing)
        return existing

    def to_dict(self):
        parent = super(SchemaModel, self)
        data = parent.to_dict() if hasattr(parent, 'to_dict') else {}
        data['$schema'] = self._schema
        for prop in self.schema_visitor.properties:
            if prop.is_value or prop.inline or \
                    (prop.is_array and prop.items.inline):
                value = getattr(self, prop.name)
                if value is not None:
                    data[prop.name] = value
        return data
