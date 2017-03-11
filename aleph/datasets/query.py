import os
import unicodecsv
import six
import logging
import requests
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

    def __repr__(self):
        return '<QueryTable(%r,%r)>' % (self.alias_ref, self.table_ref)


class DBQueryTable(QueryTable):

    def __init__(self, query, data):
        super(DBQueryTable, self).__init__(query, data)
        self.table = Table(self.table_ref, self.query.meta, autoload=True)
        self.alias = self.table.alias(self.alias_ref)

        self.refs = {}
        for column in self.alias.columns:
            name = '%s.%s' % (self.alias_ref, column.name)
            labeled_column = column.label('col_%s' % uuid4().get_hex()[:10])
            self.refs[name] = labeled_column
            self.refs[column.name] = labeled_column

    def __repr__(self):
        return '<DBQueryTable(%r,%r)>' % (self.alias_ref, self.table_ref)


class CSVQueryTable(QueryTable):

    def __init__(self, query, data):
        super(CSVQueryTable, self).__init__(query, data)
        self.table_location = data.get('table_location')
        self.csv_reader, self.columns = self.create_csv_reader()

        self.refs = {}
        for column in self.columns:
            name = '%s.%s' % (self.alias_ref, self.strip_cell(column))
            self.refs[column] = name
            self.refs[name] = column

    def strip_cell(self, fn):
        fn = fn.strip()
        if fn[0] == '"' and fn[-1] == '"':
            fn = fn[1:-1].strip()  # In case of interior whitespace
        return fn

    def create_csv_reader(self):
        try:
            r = requests.get(self.table_location, stream=True)
            r.raise_for_status()
        except ValueError:
            reader = self.csv_iterator()
            # Get column names
            with open(os.path.expandvars(self.table_location)) as fh:
                temp_reader = unicodecsv.reader(fh)
                fieldnames = temp_reader.next()
        except requests.exceptions.RequestException as e:
            log.info('create_csv_reader: %s' % e)
            return
        else:
            if r.encoding is None:
                r.encoding = 'utf-8'
            reader = unicodecsv.DictReader(r.iter_lines(decode_unicode=True))
            fieldnames = reader.fieldnames

        return reader, fieldnames

    def csv_iterator(self):
        with open(os.path.expandvars(self.table_location)) as fh:
            r = unicodecsv.DictReader(fh)
            for row in r:
                yield row

    def __repr__(self):
        return '<CSVQueryTable(%r,%r)>' % (self.alias_ref, self.table_ref)


class Query(object):
    """A dataset describes one set of data to be loaded."""

    def __init__(self, dataset, data):
        self.dataset = dataset
        self.data = data

        self.entities = []
        for ename, edata in data.get('entities').items():
            self.entities.append(EntityMapper(self, ename, edata))

        self.links = []
        for ldata in data.get('links', []):
            self.links.append(LinkMapper(self, ldata))

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


class DBQuery(Query):

    def __init__(self, dataset, data):
        super(DBQuery, self).__init__(dataset, data)

        tables = dict_list(data, 'table', 'tables')

        self.database_uri = os.path.expandvars(data.get('database'))
        self.tables = [DBQueryTable(self, f) for f in tables]

    @property
    def engine(self):
        if not hasattr(self, '_engine'):
            self._engine = create_engine(self.database_uri,
                                         poolclass=NullPool)
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


class CSVQuery(Query):
    def __init__(self, dataset, data):
        super(CSVQuery, self).__init__(dataset, data)

        tables = dict_list(data, 'table', 'tables')

        self.tables = [CSVQueryTable(self, f) for f in tables]

    def compose_query(self):
        tables = ', '.join(['table "%s" from %s' % (table.table_ref,
                                                    table.table_location)
                           for table in self.tables])
        columns = 'on columns ' + ', '.join(['%s as %s' % (self.get_column(ref),
                                                           ref)
                                             for ref in self.active_refs])
        filters = ['%s == %s' % (col, val)
                   for col, val in self.data.get('filters', {}).items()]
        filters_not = ['%s != %s' % (col, val)
                       for col, val in self.data.get('filters_not', {}).items()] # noqa
        joins = ['%s == %s' % (j.get('left'), j.get('right'))
                 for j in self.data.get('joins', [])]
        where = ''
        if len(filters) or len(filters_not) or len(joins):
            where += 'where '
            where += ', '.join(filters + filters_not + joins)
        return ', '.join([tables, columns, where])

    def check_filters(self, data_k, data_v):
        passes = True
        for k, v in self.data.get('filters', {}).items():
            if k == data_k and str(v).decode('utf-8') != data_v:
                passes = False
        for k, v in self.data.get('filters_not', {}).items():
            if k == data_k and str(v).decode('utf-8') == data_v:
                passes = False
        return passes

    def iterrows(self):
        """Compose the actual query and return an iterator of ``Record``."""
        mapping = {self.get_column(r): r for r in self.active_refs}
        q = self.compose_query()
        log.info("Query [%s]: %s", self.dataset.name, q)
        log.info("Query executed, loading data...")
        filters = self.data.get('filters')
        filters_not = self.data.get('filters_not')
        for table in self.tables:
            for row in table.csv_reader:
                data = {}
                for k, v in row.items():
                    k = mapping.get(k)
                    if k is not None:
                        if self.check_filters(k, v):
                            data[k] = table.strip_cell(v)
                yield data
        log.info("Loading done.")

    def __repr__(self):
        return '<Query(%s)>' % self.dataset
