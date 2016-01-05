from werkzeug.datastructures import MultiDict
from collections import OrderedDict
from sqlalchemy import func, select

from aleph.core import db


class TabularQuery(object):

    def __init__(self, tabular, args):
        self.tabular = tabular
        self.args = MultiDict(args)

    def clone(self):
        return TabularQuery(self.tabular, MultiDict(self.args))

    def limit(self, n):
        cq = self.clone()
        cq.args['limit'] = n
        return cq

    def offset(self, n):
        cq = self.clone()
        cq.args['offset'] = n
        return cq

    def query(self, count_only=False):
        if count_only:
            columns = [func.count()]
        else:
            columns = [c for c in self.tabular.table.columns
                       if not c.name.startswith('_')]
        q = select(columns=columns, from_obj=[self.tabular.table])
        if not count_only:
            q = q.order_by(self.tabular.table.c._id.asc())
        if 'limit' in self.args:
            q = q.limit(self.args.get('limit'))
        if 'offset' in self.args:
            q = q.offset(self.args.get('offset'))
        return q

    def __len__(self):
        if not hasattr(self, '_count'):
            rp = db.engine.execute(self.query(count_only=True))
            self._count = rp.scalar()
        return self._count

    def __iter__(self):
        rp = db.engine.execute(self.query())
        while True:
            rows = rp.fetchmany(2000)
            if not rows:
                return
            for row in rows:
                yield OrderedDict(row.items())
