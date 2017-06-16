from normality import stringify

from aleph.pager import BaseQuery


class QueryState(BaseQuery):
    """Hold state for common query parameters."""

    def __init__(self, args, authz, limit=None):
        super(QueryState, self).__init__(args, authz, limit=limit)
        self.raw_query = None
        self.facet_names = self.getlist('facet')
        self.highlight = []

    @property
    def facet_size(self):
        return self.getint('facet_size', 50)

    @property
    def text(self):
        return stringify(self.get('q'))

    @property
    def has_text(self):
        return self.text is not None

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
    def highlight_terms(self):
        if self.has_text:
            yield self.text
        for term in self.highlight:
            yield term
