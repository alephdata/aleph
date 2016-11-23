from aleph.graph.schema import Schema
from aleph.graph.datasets import Dataset


class GraphModel(object):
    """A data model for a memorious instance.

    Only one model is active at any time, and it is typically read from a
    YAML or JSON file. It hosts the schema definition (entity and link
    models) for the instance, authorization groups and, most importantly,
    the datasets defined for import.
    """

    def __init__(self, schema, datasets):
        self.schemata = []
        for section in Schema.SECTIONS:
            for name, sconfig in schema.get(section, {}).items():
                self.schemata.append(Schema(self, section, name, sconfig))

        self.datasets = []
        for name, dconfig in datasets.get('datasets', {}).items():
            self.datasets.append(Dataset(self, name, dconfig))

    def get_schema(self, section, name):
        for schema in self.schemata:
            if schema.section == section and schema.name == name:
                return schema
        raise TypeError("No such schema for %s: %s" % (section, name))

    def get_dataset(self, name):
        for dataset in self.datasets:
            if dataset.name == name:
                return dataset
        raise NameError("No such dataset: %s" % name)

    def merge_entity_schema(self, left, right):
        if left == right:
            return left
        lefts = self.get_schema(Schema.ENTITY, left)
        lefts = [s.name for s in lefts.schemata]
        if right in lefts:
            return left

        rights = self.get_schema(Schema.ENTITY, right)
        rights = [s.name for s in rights.schemata]
        if left in rights:
            return right

        for left in lefts:
            for right in rights:
                if left == right:
                    return left

    def __repr__(self):
        return '<GraphModel(%r, %r)>' % (self.schemata, self.datasets)
