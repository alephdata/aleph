from apikit.args import BOOL_TRUISH
from werkzeug.datastructures import MultiDict

from aleph.model import Entity
from aleph.text import string_value


class QueryState(object):
    """Hold state for common query parameters."""

    def __init__(self, args, authz, limit=None):
        if not isinstance(args, MultiDict):
            args = MultiDict(args)
        self.args = args
        self.authz = authz
        self._limit = limit
        self.raw_query = None

        self.facet_names = self.getlist('facet')
        self.highlight = []

    @property
    def limit(self):
        if self._limit is not None:
            return self._limit
        return min(1000, max(0, self.getint('limit', 30)))

    @property
    def offset(self):
        return max(0, self.getint('offset', 0))

    @property
    def facet_size(self):
        return self.getint('facet_size', 50)

    @property
    def page(self):
        if self.limit == 0:
            return 1
        return (self.offset / self.limit) + 1

    @property
    def text(self):
        return self.get('q') or ''

    @property
    def has_text(self):
        if self.text is None:
            return False
        return len(self.text.strip()) > 0

    @property
    def has_query(self):
        if self.has_text:
            return True
        for (field, value) in self.filter_items:
            return True
        return False

    @property
    def sort(self):
        return self.get('sort', 'score').strip().lower()

    @property
    def entities(self):
        if not hasattr(self, '_entities'):
            cs = self.authz.collections_read
            ids = self.getlist('filter:entities.id')
            self._entities = Entity.by_id_set(ids, collections=cs)
        return self._entities

    @property
    def entity_terms(self):
        if not hasattr(self, '_entity_terms'):
            self._entity_terms = set()
            for entity in self.entities.values():
                for term in entity.regex_terms:
                    self._entity_terms.add(term)
        return self._entity_terms

    @property
    def highlight_terms(self):
        for term in self.highlight:
            yield term
        for term in self.entity_terms:
            yield term

    @property
    def collection_id(self):
        """Return the set of collection IDs to be queried."""
        collection_ids = set()
        for value in self.get_filters('collection_id'):
            try:
                value = int(value)
            except:
                continue
            if value in self.authz.collections_read:
                collection_ids.add(value)
        return list(collection_ids)

    @property
    def filter_items(self):
        for key in self.args.keys():
            if not key.startswith('filter:'):
                continue
            _, field = key.split(':', 1)
            for value in self.getlist(key):
                yield (field, value)

    def get_filters(self, field):
        for f, value in self.filter_items:
            if f == field:
                yield value

    @property
    def filters(self):
        filters = {}
        for field, value in self.filter_items:
            if field not in filters:
                filters[field] = set([value])
            else:
                filters[field].add(value)
        filters['collection_id'] = self.collection_id
        return filters

    def getfilter(self, name):
        filters = self.filters.get(name) or []
        return list(filters)

    @property
    def items(self):
        for (k, v) in self.args.iteritems(multi=True):
            if k == 'offset':
                continue
            yield k, v

    def getlist(self, name, default=None):
        if name not in self.args:
            return default or []
        return self.args.getlist(name)

    def get(self, name, default=None):
        for value in self.getlist(name):
            value = string_value(value)
            if value is not None:
                return value
        return default

    def getint(self, name, default=None):
        value = self.get(name, default)
        try:
            return int(value)
        except (ValueError, TypeError):
            return default

    def getbool(self, name, default=False):
        value = self.get(name)
        if value is None:
            return default
        return value.lower() in BOOL_TRUISH
