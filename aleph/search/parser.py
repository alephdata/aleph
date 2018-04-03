from banal import as_bool
from normality import stringify
from werkzeug.datastructures import MultiDict, OrderedMultiDict

# cf. https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-from-size.html  # noqa
MAX_RESULT_WINDOW = 9999


class QueryParser(object):
    """Hold state for common query parameters."""
    SORT_ASC = 'asc'
    SORT_DESC = 'desc'
    SORT_DEFAULT = SORT_ASC
    SORTS = [SORT_ASC, SORT_DESC]

    def __init__(self, args, authz, limit=None):
        if not isinstance(args, MultiDict):
            args = OrderedMultiDict(args)
        self.args = args
        self.authz = authz
        self.offset = max(0, self.getint('offset', 0))
        if limit is None:
            limit = min(MAX_RESULT_WINDOW, max(0, self.getint('limit', 20)))
        self.limit = limit
        self.text = stringify(self.get('q'))
        self.prefix = stringify(self.get('prefix'))

    @property
    def page(self):
        if self.limit == 0:
            return 1
        return (self.offset / self.limit) + 1

    def prefixed_items(self, prefix):
        items = {}
        for key in self.args.keys():
            if not key.startswith(prefix):
                continue
            name = key[len(prefix):]
            items[name] = set(self.getlist(key))
        return items

    @property
    def post_filters(self):
        return self.prefixed_items('post_filter:')

    @property
    def filters(self):
        return self.prefixed_items('filter:')

    @property
    def exclude(self):
        return self.getlist('exclude')

    @property
    def sorts(self):
        sort = []
        for value in self.getlist('sort'):
            direction = self.SORT_DEFAULT
            if ':' in value:
                value, direction = value.rsplit(':', 1)
            if direction in self.SORTS:
                sort.append((value, direction))
        return sort

    @property
    def items(self):
        for (key, value) in self.args.iteritems(multi=True):
            if key == 'offset':
                continue
            value = stringify(value, encoding='utf-8')
            if value is not None:
                yield key, value

    def getlist(self, name, default=None):
        values = []
        for value in self.args.getlist(name):
            value = stringify(value, encoding='utf-8')
            if value is not None:
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
        return as_bool(self.get(name), default=default)


class SearchQueryParser(QueryParser):
    """ElasticSearch-specific query parameters."""

    def __init__(self, args, authz, limit=None):
        super(SearchQueryParser, self).__init__(args, authz, limit=limit)
        self.offset = min(MAX_RESULT_WINDOW, self.offset)
        if (self.limit + self.offset) > MAX_RESULT_WINDOW:
            self.limit = max(0, MAX_RESULT_WINDOW - self.offset)

        # Set of field names to facet by (i.e. include the count of distinct
        # values in the result set). These must match 'keyword' fields in the
        # index.
        self.facet_names = self.getlist('facet')
        # Number of distinct values to be included (i.e. top N)
        self.facet_size = self.getint('facet_size', 50)
        # Flag to perform a count of the total number of distinct values.
        self.facet_total = self.getbool('facet_total', False)
        # Flag to disable returning actual values (i.e. count only)
        self.facet_values = self.getbool('facet_values', True)

        # Include highlighted fragments of matching text in the result.
        self.highlight = self.getbool('highlight', False)
        # Length of each snippet in characters
        self.highlight_length = self.getint('highlight_length', 100)
        # Number of snippets per document, 0 = return full document text.
        self.highlight_count = self.getint('highlight_count', 5)
