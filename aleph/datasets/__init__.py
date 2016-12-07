import six
import logging

from aleph.util import dict_list
from aleph.model import Role
from aleph.datasets.query import Query

log = logging.getLogger(__name__)


class Dataset(object):
    """A dataset describes one set of data to be loaded."""

    def __init__(self, name, data):
        self.name = six.text_type(name)
        self.data = data
        self.label = data.get('label', name)
        self.info_url = data.get('info_url')
        self.roles = []
        self.doc_count = None
        for role in dict_list(data, 'roles', 'role'):
            role_id = Role.load_id(role)
            if role_id is not None:
                self.roles.append(role_id)
            else:
                log.warning("Could not find role: %s", role)

        if not len(self.roles):
            raise ValueError("No roles for dataset: %s" % self.name)

        self._queries = dict_list(data, 'queries', 'query')

    @property
    def queries(self):
        for query in self._queries:
            yield Query(self, query)

    def to_dict(self):
        return {
            'name': self.name,
            'label': self.label,
            'info_url': self.info_url,
            'roles': self.roles,
            'doc_count': self.doc_count
        }

    def __repr__(self):
        return '<Dataset(%r, %r)>' % (self.name, self.label)


class DatasetSet(object):

    def __init__(self, datasets):
        self.datasets = []
        for name, dconfig in datasets.get('datasets', {}).items():
            self.datasets.append(Dataset(name, dconfig))

    def get(self, name):
        for dataset in self.datasets:
            if dataset.name == name:
                return dataset
        raise NameError("No such dataset: %s" % name)

    def __iter__(self):
        return iter(self.datasets)

    def __repr__(self):
        return '<DatasetSet(%r)>' % self.datasets
