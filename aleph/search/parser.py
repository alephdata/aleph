import logging
from banal import as_bool
from followthemoney.util import sanitize_text
from werkzeug.datastructures import MultiDict, OrderedMultiDict

from aleph.settings import SETTINGS
from aleph.index.util import MAX_PAGE

log = logging.getLogger(__name__)


class QueryParser(object):
    """Hold state for common query parameters."""

    SORT_ASC = "asc"
    SORT_DESC = "desc"
    SORT_DEFAULT = SORT_ASC
    SORTS = [SORT_ASC, SORT_DESC]

    def __init__(self, args, authz, limit=None, max_limit=MAX_PAGE):
        if not isinstance(args, MultiDict):
            args = OrderedMultiDict(args)
        self.args = args
        self.authz = authz
        self.offset = max(0, self.getint("offset", 0))
        if limit is None:
            limit = min(max_limit, max(0, self.getint("limit", 20)))
        self.limit = limit
        self.next_limit = self.getint("next_limit", limit)
        self.text = sanitize_text(self.get("q"))
        self.prefix = sanitize_text(self.get("prefix"))

        # Disable or enable query caching
        self.cache = self.getbool("cache", SETTINGS.CACHE)
        self.filters = self.prefixed_items("filter:")
        self.excludes = self.prefixed_items("exclude:")
        self.empties = self.prefixed_items("empty:")

    @property
    def page(self):
        if self.limit == 0:
            return 1
        return (self.offset // self.limit) + 1

    def prefixed_items(self, prefix):
        items = {}
        for key in self.args.keys():
            if not key.startswith(prefix):
                continue
            name = key[len(prefix) :]
            items[name] = set(self.getlist(key))
        return items

    @property
    def sorts(self):
        sort = []
        for value in self.getlist("sort"):
            direction = self.SORT_DEFAULT
            if ":" in value:
                value, direction = value.rsplit(":", 1)
            if direction in self.SORTS:
                sort.append((value, direction))
        return sort

    @property
    def items(self):
        for key, value in self.args.items(multi=True):
            if key in ("offset", "limit", "next_limit"):
                continue
            value = sanitize_text(value, encoding="utf-8")
            if value is not None:
                yield key, value

    def getlist(self, name, default=None):
        values = []
        for value in self.args.getlist(name):
            value = sanitize_text(value, encoding="utf-8")
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

    def to_dict(self):
        parser = {
            "text": self.text,
            "prefix": self.prefix,
            "offset": self.offset,
            "limit": self.limit,
            "filters": {key: list(val) for key, val in self.filters.items()},
            "sorts": self.sorts,
            "empties": {key: list(val) for key, val in self.empties.items()},
            "excludes": {key: list(val) for key, val in self.excludes.items()},
        }
        return parser


class SearchQueryParser(QueryParser):
    """ElasticSearch-specific query parameters."""

    # Facets with known, limited cardinality:
    SMALL_FACETS = ("schema", "schemata", "collection_id", "countries", "languages")

    def __init__(self, args, authz, limit=None):
        super(SearchQueryParser, self).__init__(args, authz, limit=limit)
        self.offset = min(MAX_PAGE, self.offset)
        if (self.limit + self.offset) > MAX_PAGE:
            self.limit = max(0, MAX_PAGE - self.offset)

        # Set of field names to facet by (i.e. include the count of distinct
        # values in the result set). These must match 'keyword' fields in the
        # index.
        self.facet_names = set(self.getlist("facet"))

        # Query to use for highlighting, defaults to the search query
        self.highlight_text = self.get("highlight_text", self.text)
        # Include highlighted fragments of matching text in the result.
        self.highlight = self.getbool("highlight", False)
        self.highlight = self.highlight and SETTINGS.RESULT_HIGHLIGHT
        self.highlight = self.highlight and self.highlight_text
        # Length of each snippet in characters
        self.highlight_length = self.getint("highlight_length", 120)
        # Number of snippets per document, 0 = return full document text.
        self.highlight_count = self.getint("highlight_count", 3)
        # By default, the maximum number of characters analyzed for a highlight
        # request is bounded by the value defined in the
        # index.highlight.max_analyzed_offset setting (1000000 by default),
        # and when the number of characters exceeds this limit an error is
        # returned. By setting `max_analyzed_offset` to a non-negative value
        # lower than `index.highlight.max_analyzed_offset`, the highlighting
        # stops at this defined maximum limit, and the rest of the text is not
        # processed, thus not highlighted and no error is returned.
        self.max_highlight_analyzed_offset = self.getint(
            "max_highlight_analyzed_offset", 999999
        )

    def get_facet_size(self, name):
        """Number of distinct values to be included (i.e. top N)."""
        facet_size = self.getint("facet_size:%s" % name, 20)
        # Added to mitigate a DDoS by scripted facet bots (2020-11-24):
        if not self.authz.logged_in and name not in self.SMALL_FACETS:
            facet_size = min(50, facet_size)
        return facet_size

    def get_facet_total(self, name):
        """Flag to perform a count of the total number of distinct values."""
        if not self.authz.logged_in and name not in self.SMALL_FACETS:
            return False
        return self.getbool("facet_total:%s" % name, False)

    def get_facet_values(self, name):
        """Flag to disable returning actual values (i.e. count only)."""
        # Added to mitigate a DDoS by scripted facet bots (2020-11-24):
        if self.get_facet_size(name) == 0:
            return False
        return self.getbool("facet_values:%s" % name, True)

    def get_facet_type(self, name):
        return self.get("facet_type:%s" % name)

    def get_facet_interval(self, name):
        """Interval to facet on when faceting on date properties

        See https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-datehistogram-aggregation.html#calendar_intervals   # noqa
        for available options for possible values
        """
        return self.get("facet_interval:%s" % name)

    def to_dict(self):
        parser = super(SearchQueryParser, self).to_dict()
        parser["facet_filters"] = list(self.facet_filters)
        return parser
