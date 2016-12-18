import os
import six
import logging
from uuid import uuid4
from sqlalchemy import create_engine, MetaData
from sqlalchemy import select, text as sql_text
from sqlalchemy.pool import NullPool
from sqlalchemy.schema import Table

from aleph.util import dict_list
from aleph.datasets.mapper import EntityMapper, LinkMapper

log = logging.getLogger(__name__)
DATA_PAGE = 10000


class QueryTable(object):
    """A table to be joined in."""

    def __init__(self, query, data):
        self.query = query
        if isinstance(data, six.string_types):
            data = {'table': data}
        self.data = data
        self.table_ref = data.get('table')
        self.alias_ref = data.get('alias', self.table_ref)
        self.table = Table(self.table_ref, self.query.meta, autoload=True)
        self.alias = self.table.alias(self.alias_ref)

        self.refs = {}
        for column in self.alias.columns:
            name = '%s.%s' % (self.alias_ref, column.name)
            labeled_column = column.label('col_%s' % uuid4().get_hex()[:10])
            self.refs[name] = labeled_column
            self.refs[column.name] = labeled_column

    def __repr__(self):
        return '<QueryTable(%r,%r)>' % (self.alias_ref, self.table_ref)


class Query(object):
    """A dataset describes one set of data to be loaded."""

    def __init__(self, dataset, data):
        self.dataset = dataset
        self.data = data
        self.database_uri = os.path.expandvars(data.get('database'))

        tables = dict_list(data, 'table', 'tables')
        self.tables = [QueryTable(self, f) for f in tables]

        self.entities = []
        for ename, edata in data.get('entities').items():
            self.entities.append(EntityMapper(self, ename, edata))

        self.links = []
        for ldata in data.get('links', []):
            self.links.append(LinkMapper(self, ldata))

    @property
    def engine(self):
        if not hasattr(self, '_engine'):
            self._engine = create_engine(self.database_uri, poolclass=NullPool)
        return self._engine

    @property
    def meta(self):
        if not hasattr(self, '_meta'):
            self._meta = MetaData()
            self._meta.bind = self.engine
        return self._meta

    def get_column(self, ref):
        for table in self.tables:
            if ref in table.refs:
                return table.refs.get(ref)
        raise TypeError("[%r] Cannot find column: %s" % (self, ref))

    def get_table(self, ref):
        for table in self.tables:
            if ref == table.alias_ref:
                return table
        raise TypeError("[%r] Cannot find table: %s" % (self, ref))

    @property
    def from_clause(self):
        return [t.alias for t in self.tables]

    @property
    def active_refs(self):
        refs = set()
        for item in self.entities + self.links:
            for ref in item.refs:
                refs.add(ref)
        return refs

    @property
    def mapped_columns(self):
        """Determine which columns must be selected.

        This will check entity and link mappings for the set of columns
        actually used in order to avoid loading superfluous data.
        """
        return [self.get_column(r) for r in self.active_refs]

    def apply_filters(self, q):
        for col, val in self.data.get('filters', {}).items():
            q = q.where(self.get_column(col) == val)
        for col, val in self.data.get('filters_not', {}).items():
            q = q.where(self.get_column(col) != val)
        # not sure this is a great idea:
        if self.data.get('where'):
            q = q.where(sql_text(self.data.get('where')))
        for join in self.data.get('joins', []):
            left = self.get_column(join.get('left'))
            right = self.get_column(join.get('right'))
            q = q.where(left == right)
        return q

    def compose_query(self):
        q = select(columns=self.mapped_columns, from_obj=self.from_clause,
                   use_labels=True)
        q = self.apply_filters(q)
        return q

    def iterrows(self):
        """Compose the actual query and return an iterator of ``Record``."""
        mapping = {self.get_column(r).name: r for r in self.active_refs}

        q = self.compose_query()
        log.info("Query [%s]: %s", self.dataset.name, q)
        rp = self.engine.execute(q)
        log.info("Query executed, loading data...")
        while True:
            rows = rp.fetchmany(DATA_PAGE)
            if not len(rows):
                log.info("Loading done.")
                break
            for row in rows:
                data = {}
                for k, v in row.items():
                    k = mapping.get(k, k)
                    data[k] = v
                yield data

    def __repr__(self):
        return '<Query(%s)>' % self.dataset
