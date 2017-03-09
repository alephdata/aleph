import os
import unicodecsv
import six
import logging
import requests
import pandas as pd
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
        self.table_location = data.get('table_location')
        if self.table_location:
            self.csv_reader, self.columns = self.create_csv_reader()
        else:
            self.table = Table(self.table_ref, self.query.meta, autoload=True)
            self.alias = self.table.alias(self.alias_ref)
            self.columns = self.alias.columns
        self.refs = {}
        for column in self.columns:
            labeled_column = 'col_%s' % uuid4().get_hex()[:10]
            if hasattr(column, 'name') and hasattr(column, 'label'):
                column_name = column.name
                labeled_column = column.label('col_%s' % uuid4().get_hex()[:10])
            else:
                column_name = column
            name = '%s.%s' % (self.alias_ref, self.strip_cell(column_name))
            self.refs[name] = labeled_column
            self.refs[column_name] = labeled_column

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
            log.info('create_reader: %s' % e)
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
        return '<QueryTable(%r,%r)>' % (self.alias_ref, self.table_ref)


class Query(object):
    """A dataset describes one set of data to be loaded."""

    def __init__(self, dataset, data):
        self.dataset = dataset
        self.data = data
        self.db_connect = data.get('database') is not None
        if self.db_connect:
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
        if self.db_connect:
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

    def create_dataframe(self):
        """Create dataframe from our CSV table(s)"""
        dfs = {}
        for table in self.tables:
            data = []
            for line in table.csv_reader:
                datum = {}
                for k, v in table.refs.items():
                    if k in line.keys():
                        datum[v] = table.strip_cell(line[k])
                        data.append(datum)
            df = pd.DataFrame(data)
            for col, val in self.data.get('filters', {}).items():
                if col in table.refs.keys():
                    df = df[df[self.get_column(col)] == val]
            for col, val in self.data.get('filters_not', {}).items():
                if col in table.refs.keys():
                    df = df[df[self.get_column(col)] != val]
            dfs[table.table_ref] = df
        # Now the joins
        for join in self.data.get('joins', []):
            left = dfs[join.get('left').split('.')[0]]
            left_on = self.get_column(join.get('left'))
            right = dfs[join.get('right').split('.')[0]]
            right_on = self.get_column(join.get('right'))
            dfs[join.get('left').split('.')[0]] = left.merge(right,
                                                             left_on=left_on,
                                                             right_on=right_on,
                                                             how='inner')
            final_df = dfs[join.get('left').split('.')[0]]

        # In case we've only got a single dataframe and no joins
        if len(dfs.keys()) == 1:
            final_df = dfs[dfs.keys()[0]]

        return final_df

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

    def compose_csv_query(self):
        tables = '; '.join(['table "%s" from %s using columns %s' %
                            (table.table_ref, table.table_location,
                             ', '.join(['%s as %s' %
                                        (ref, self.get_column(ref))
                                        for ref in self.active_refs]))
                           for table in self.tables])
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
        return ', '.join([tables, where])

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

    def itercsvrows(self):
        """Compose the actual query and return an iterator of ``Record``."""
        mapping = {self.get_column(r): r for r in self.active_refs}
        csv_q = self.compose_csv_query()
        log.info("Query [%s]: %s", self.dataset.name, csv_q)
        rp = self.create_dataframe()
        log.info("Query executed, loading data...")
        rows = rp.itertuples(index=False)
        for row in rows:
            data = {}
            for f in row._fields:
                mf = mapping.get(f, f)
                data[mf] = getattr(row, f)
            yield data
        log.info("Loading done.")

    def __repr__(self):
        return '<Query(%s)>' % self.dataset
