import six
import logging

from aleph.authz import get_public_roles
from aleph.util import dict_list
from aleph.model import Role
from aleph.datasets.query import DBQuery, CSVQuery

log = logging.getLogger(__name__)


class Dataset(object):
    """A dataset describes one set of data to be loaded."""

    def __init__(self, name, data):
        self.name = six.text_type(name)
        self.data = data
        self.label = data.get('label', name)
        self.info_url = data.get('info_url')
        self.category = data.get('category')
        self.roles = []
        self.entities_count = None
        self.public = False

        for role in dict_list(data, 'roles', 'role'):
            role_id = Role.load_id(role)
            if role_id is not None:
                self.roles.append(role_id)
            else:
                log.warning("Could not find role: %s", role)
            if role_id in get_public_roles():
                self.public = True

        if not len(self.roles):
            raise ValueError("No roles for dataset: %s" % self.name)

        self._queries = dict_list(data, 'queries', 'query')

    @property
    def countries(self):
        # This is cached only once for each run-time, basically as a really
        # stupid cache. Perhaps configuring countries explicitly, or giving
        # this into a memoization tool that timeouts every N hours would be
        # a good idea.
        if not hasattr(self, '_countries'):
            from aleph.search.entities import get_dataset_countries
            self._countries = get_dataset_countries(self.name)
        return self._countries

    @property
    def queries(self):
        for query in self._queries:
            if 'database' in query or 'databases' in query:
                yield DBQuery(self, query)
            else:
                yield CSVQuery(self, query)

    def to_dict(self):
        return {
            'name': self.name,
            'label': self.label,
            'info_url': self.info_url,
            'roles': self.roles,
            'public': self.public,
            'category': self.category,
            'countries': self.countries,
            'entities_count': self.entities_count
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
