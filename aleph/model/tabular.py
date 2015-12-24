from collections import OrderedDict

from normality import slugify
from sqlalchemy import MetaData
from sqlalchemy import func, select
from sqlalchemy.schema import Table, Column
from sqlalchemy.types import Unicode

from aleph.core import db


class TabularColumn(object):

    def __init__(self, schema, data):
        self.schema = schema
        self.data = data
        self.label = data.get('label')
        self.name = data.get('name')

    def __repr__(self):
        return '<TabularColumn(%r,%r)>' % (self.label, self.name)


class TabularSchema(object):

    def __init__(self, schema=None):
        self.schema = schema or {}
        if 'columns' not in self.schema:
            self.schema['columns'] = []

    def add_column(self, label):
        column = slugify(label or '', sep='_')[:55]
        column = column or 'column'
        name, i = column, 2
        # de-dupe: column, column_2, column_3, ...
        while name in [c.name for c in self.columns]:
            name = '%s_%s' % (name, i)
            i += 1
        column = {'label': label, 'name': column}
        self.schema['columns'].append(column)
        return TabularColumn(self, column)

    @property
    def table_name(self):
        return 'tabular_%s_%s' % (self.schema.get('content_hash'),
                                  self.schema.get('sheet'))

    @property
    def columns(self):
        for col in self.schema['columns']:
            yield TabularColumn(self, col)

    def to_dict(self):
        return self.schema

    def __repr__(self):
        return '<TabularSchema(%r)>' % list(self.columns)


class Tabular(object):

    def __init__(self, schema):
        self.schema = schema
        self.bind = db.engine
        self.meta = MetaData()
        self.meta.bind = self.bind
        self._table = None

    @property
    def table(self):
        """ Generate an appropriate table representation to mirror the
        fields known for this table. """
        if self._table is None:
            self._table = Table(self.schema.table_name, self.meta)
            id_col = Column('_id', Unicode(42), primary_key=True)
            self._table.append_column(id_col)
            for column in self.schema.columns:
                column = Column(column.name, Unicode, nullable=True)
                self._table.append_column(column)
        return self._table

    @property
    def exists(self):
        return db.engine.has_table(self.table.name)

    def load_iter(self, iterable, chunk_size=5000):
        """ Bulk load all the data in an artifact to a matching database
        table. """
        chunk = []

        conn = self.bind.connect()
        tx = conn.begin()
        try:
            for i, record in enumerate(iterable):
                record['_id'] = i
                chunk.append(record)
                if len(chunk) >= chunk_size:
                    stmt = self.table.insert()
                    conn.execute(stmt, chunk)
                    chunk = []

            if len(chunk):
                stmt = self.table.insert()
                conn.execute(stmt, chunk)
            tx.commit()
        except:
            tx.rollback()
            raise

    def create(self):
        """ Create the fact table if it does not exist. """
        if not self.exists:
            self.table.create(self.bind)

    def drop(self):
        """ Drop the fact table if it does exist. """
        if self.exists:
            self.table.drop()
        self._table = None

    def __len__(self):
        if not hasattr(self, '_count'):
            q = select(columns=func.count(self.table.c._id),
                       from_obj=self.table)
            rp = self.db.engine.execute(q)
            self._count = rp.scalar()
        return self._count

    def __iter__(self):
        q = select(columns=self.table, from_obj=self.table)
        rp = self.db.engine.execute(q)
        while True:
            rows = rp.fetchmany(2000)
            if not rows:
                return
            for row in rows:
                yield OrderedDict(row.items())

    def __repr__(self):
        return '<Tabular(%r)>' % self.document
