import os
import six
import logging
import requests
from uuid import uuid4
from unicodecsv import DictReader
from sqlalchemy import create_engine, MetaData
from sqlalchemy import select, text as sql_text
from sqlalchemy.pool import NullPool
from sqlalchemy.schema import Table

from aleph.util import dict_list
from aleph.text import string_value
from aleph.logic.bulk.mapper import EntityMapper, LinkMapper

log = logging.getLogger(__name__)
DATA_PAGE = 2000


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

    def __init__(self, collection, data):
        self.collection = collection
        self.roles = collection.roles
        self.data = data

        self.entities = []
        for ename, edata in data.get('entities').items():
            self.entities.append(EntityMapper(self, ename, edata))

        self.links = []
        for ldata in data.get('links', []):
            self.links.append(LinkMapper(self, ldata))

    @property
    def active_refs(self):
        refs = set()
        for item in self.entities + self.links:
            for ref in item.refs:
                refs.add(ref)
        return refs

    def __repr__(self):
        return '<Query(%s)>' % self.collection.foreign_id


class DatabaseQuery(Query):

    def __init__(self, collection, data):
        super(DatabaseQuery, self).__init__(collection, data)

        tables = dict_list(data, 'table', 'tables')

        self.database_uri = os.path.expandvars(data.get('database'))
        self.tables = [QueryTable(self, f) for f in tables]

    @property
    def engine(self):
        if not hasattr(self, '_engine'):
            kwargs = {}
            if self.database_uri.lower().startswith('postgres'):
                kwargs['server_side_cursors'] = True
            self._engine = create_engine(self.database_uri,
                                         poolclass=NullPool,
                                         **kwargs)
        return self._engine

    @property
    def meta(self):
        if not hasattr(self, '_meta'):
            self._meta = MetaData()
            self._meta.bind = self.engine
        return self._meta

    @property
    def from_clause(self):
        return [t.alias for t in self.tables]

    @property
    def mapped_columns(self):
        """Determine which columns must be selected.

        This will check entity and link mappings for the set of columns
        actually used in order to avoid loading superfluous data.
        """
        return [self.get_column(r) for r in self.active_refs]

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
        return self.apply_filters(q)

    def iterrows(self):
        """Compose the actual query and return an iterator of ``Record``."""
        mapping = {self.get_column(r).name: r for r in self.active_refs}
        q = self.compose_query()
        log.info("Query [%s]: %s", self.collection.foreign_id, q)
        rp = self.engine.execute(q)
        log.info("Query executed, loading data...")
        while True:
            rows = rp.fetchmany(size=DATA_PAGE)
            if not len(rows):
                break
            for row in rows:
                yield {mapping.get(k, k): v for k, v in row.items()}


class CSVQuery(Query):
    """Special case for entity loading directly from a CSV URL"""

    def __init__(self, collection, data):
        super(CSVQuery, self).__init__(collection, data)
        self.csv_urls = set()
        for csv_url in dict_list(data, 'csv_url', 'csv_urls'):
            self.csv_urls.add(os.path.expandvars(csv_url))

        if not len(self.csv_urls):
            log.warning("[%s]: no CSV URLs specified", collection.foreign_id)

    def read_remote_csv(self, csv_url):
        try:
            res = requests.get(csv_url, stream=True)
            res.raise_for_status()
        except requests.exceptions.RequestException as exc:
            log.error('Failed to open CSV [%s]: %s', csv_url, exc)
            return

        if res.encoding is None:
            res.encoding = 'utf-8'
        for row in DictReader(res.iter_lines(decode_unicode=False), skipinitialspace=True):
            yield row

    def read_local_csv(self, path):
        with open(path, "r") as f:
            for row in DictReader(f, skipinitialspace=True):
                yield row

    def read_csv(self, csv_url):
        parsed_url = requests.utils.urlparse(csv_url)
        if parsed_url.scheme == 'file':
            return self.read_local_csv(parsed_url.path)
        else:
            return self.read_remote_csv(csv_url)

    def check_filters(self, data):
        for k, v in self.data.get('filters', {}).items():
            if string_value(v) != data.get(k):
                return False
        for k, v in self.data.get('filters_not', {}).items():
            if string_value(v) == data.get(k):
                return False
        return True

    def iterrows(self):
        """Iterate through the table applying filters on-the-go."""
        mapping = {ref.split('.')[-1]: ref for ref in self.active_refs}
        for csv_url in self.csv_urls:
            log.info("Import [%s]: %s", self.collection.foreign_id, csv_url)
            for row in self.read_csv(csv_url):
                data = {}
                for k, v in row.items():
                    k = mapping.get(string_value(k))
                    if k is None:
                        continue
                    data[k] = string_value(v)
                if self.check_filters(data):
                    yield data

    def __repr__(self):
        return '<CSVQuery(%s)>' % self.collection.foreign_id
