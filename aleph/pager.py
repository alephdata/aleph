from werkzeug.datastructures import MultiDict
from normality import stringify
from dalet import parse_boolean


class BaseQuery(object):
    """Hold state for common query parameters."""

    def __init__(self, args, authz, limit=None):
        if not isinstance(args, MultiDict):
            args = MultiDict(args)
        self.args = args
        self.authz = authz
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
    def filter_items(self):
        for key in self.args.keys():
            if not key.startswith('filter:'):
                continue
            _, field = key.split(':', 1)

            if field == 'collection_id':
                for value in self.getintlist(key):
                    if value in self.authz.collections_read:
                        yield (field, value)
            else:
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
        for (k, v) in self.args.iteritems(multi=True):
            if k == 'offset':
                continue
            yield k, v

    def getlist(self, name, default=None):
        values = []
        for value in self.args.getlist(name):
            value = stringify(value)
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
