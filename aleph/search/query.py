from apikit.args import BOOL_TRUISH
from werkzeug.datastructures import MultiDict

from aleph.model import Entity

SORTS = {
    'score': ['_score'],
    'newest': [{'dates': 'desc'}, {'created_at': 'desc'}, '_score'],
    'oldest': [{'dates': 'asc'}, {'created_at': 'asc'}, '_score'],
    'alphabet': [{'name': 'asc'}, '_score'],
    'doc_count': [{'doc_count': 'desc'}, '_score']
}


class QueryState(object):
    """Hold state for common query parameters."""

    def __init__(self, args, authz_collections, limit=None):
        if not isinstance(args, MultiDict):
            args = MultiDict(args)
        self.args = args
        self.authz_collections = authz_collections
        self._limit = limit

    @property
    def limit(self):
        if self._limit is not None:
            return self._limit
        return min(1000, max(0, self.getint('limit', 30)))

    @property
    def offset(self):
        return max(0, self.getint('offset', 0))

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
    def sort(self):
        if self.has_text:
            return 'score'
        return self.get('sort', 'score').strip().lower()

    @property
    def entity_ids(self):
        return self.getlist('entity')

    @property
    def entities(self):
        if not hasattr(self, '_entities'):
            cs = self.authz_collections
            self._entities = Entity.by_id_set(self.entity_ids, collections=cs)
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
    def filter_items(self):
        for key in self.args.keys():
            for value in self.getlist(key):
                if not key.startswith('filter:'):
                    continue
                _, field = key.split(':', 1)
                yield (field, value)

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
            if len(value.strip()):
                return value
        return default

    def getint(self, name, default=None):
        value = self.get(name, default)
        try:
            return int(value)
        except (ValueError, TypeError):
            return default

    def getbool(self, name, default=False):
        value = self.get(name, default)
        value = unicode(value).strip().lower()
        return value in BOOL_TRUISH
