import six
import logging

from memorious.model.datasets.query import Query
from memorious.util import dict_list

log = logging.getLogger(__name__)


class Dataset(object):
    """A dataset describes one set of data to be loaded."""

    def __init__(self, model, name, data):
        self.model = model
        self.name = six.text_type(name)
        self.data = data
        self.label = data.get('label', name)
        self.info_url = data.get('info_url')
        self.groups = dict_list(data, 'groups', 'group')

        queries = dict_list(data, 'queries', 'query')
        self.queries = [Query(self, d) for d in queries]

    def __repr__(self):
        return '<Dataset(%r, %r)>' % (self.name, self.label)
