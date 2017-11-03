from normality import stringify
from dalet import parse_boolean
from werkzeug.datastructures import MultiDict

# cf. https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-from-size.html  # noqa
MAX_RESULT_WINDOW = 10000


class QueryParser(object):
    """Hold state for common query parameters."""

    def __init__(self, args, authz, limit=None):
        if not isinstance(args, MultiDict):
            args = MultiDict(args)
        self.args = args
        self.authz = authz
        self.offset = max(0, self.getint('offset', 0))
        if limit is None:
            limit = min(MAX_RESULT_WINDOW, max(0, self.getint('limit', 20)))
        self.limit = limit
        self.prefix = stringify(self.get('prefix'))

    @property
    def page(self):
        if self.limit == 0:
            return 1
        return (self.offset / self.limit) + 1

    @property
    def filter_items(self):
        for key in self.args.keys():
            if not key.startswith('filter:'):
                continue
            _, field = key.split(':', 1)

            for value in self.getlist(key):
                yield (field, value)

    @property
    def filters(self):
        filters = {}
        for field, value in self.filter_items:
            if field not in filters:
                filters[field] = set([value])
            else:
                filters[field].add(value)
        return filters

    @property
    def items(self):
        for key in self.args.keys():
            if key == 'offset':
                continue
            for value in self.getlist(key):
                yield key, value

    def getlist(self, name, default=None):
        values = []
        for value in self.args.getlist(name):
            value = stringify(value, encoding='utf-8')
            if value:
                values.append(value)
        return values or (default or [])

    def get(self, name, default=None):
        for value in self.getlist(name):
            return value
        return default

    def getintlist(self, name, default=None):
        values = []
        for value in self.getlist(name, default=default):
            try:
                values.append(int(value))
            except (ValueError, TypeError):
                pass
        return values

    def getint(self, name, default=None):
        for value in self.getintlist(name):
            return value
        return default

    def getbool(self, name, default=False):
        return parse_boolean(self.get(name), default=default)


class SearchQueryParser(QueryParser):
    """ElasticSearch-specific query parameters."""

    def __init__(self, args, authz, limit=None):
        super(SearchQueryParser, self).__init__(args, authz, limit=limit)
        self.offset = min(MAX_RESULT_WINDOW, self.offset)
        if (self.limit + self.offset) > MAX_RESULT_WINDOW:
            self.limit = max(0, MAX_RESULT_WINDOW - self.offset)
        self.facet_names = self.getlist('facet')
        self.facet_size = self.getint('facet_size', 50)
        self.text = stringify(self.get('q'))
        self.sort = self.get('sort', 'default').strip().lower()
        self.highlight = []

    @property
    def highlight_terms(self):
        if self.text is not None:
            yield self.text
        for term in self.highlight:
            yield term
