from normality import stringify

from aleph.search.parser import QueryParser


class QueryState(QueryParser):
    """ElasticSearch-specific query parameters."""

    def __init__(self, args, authz, limit=None):
        super(QueryState, self).__init__(args, authz, limit=limit)
        self.raw_query = None
        self.facet_names = self.getlist('facet')
        self.facet_size = self.getint('facet_size', 50)
        self.text = stringify(self.get('q'))
        self.has_text = self.text is not None
        self.sort = self.get('sort', 'score').strip().lower()
        self.highlight = []

    @property
    def has_query(self):
        if self.has_text:
            return True
        for (field, value) in self.filter_items:
            return True
        return False

    @property
    def highlight_terms(self):
        if self.has_text:
            yield self.text
        for term in self.highlight:
            yield term
