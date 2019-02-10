import logging
from followthemoney import model
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.ftm import pack_cells
from aleph.util import filter_texts

log = logging.getLogger(__name__)


class DocumentRecord(db.Model):
    """A record reflects a row or page of a document."""
    SCHEMA_ROW = 'Row'
    SCHEMA_PAGE = 'Page'

    id = db.Column(db.BigInteger, primary_key=True)
    index = db.Column(db.Integer, nullable=True, index=True)
    text = db.Column(db.Unicode, nullable=True)
    data = db.Column(JSONB, nullable=True)

    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'), index=True)  # noqa
    document = db.relationship("Document", backref=db.backref('records', cascade='all, delete-orphan'))  # noqa

    def raw_texts(self):
        """Utility method to get all text snippets in a record."""
        if self.data is not None:
            for value in self.data.values():
                yield value
        yield self.text

    @property
    def texts(self):
        yield from filter_texts(self.raw_texts())

    @classmethod
    def insert_records(cls, document_id, iterable, chunk_size=1000):
        chunk = []
        table = cls.__table__
        for index, data in enumerate(iterable):
            chunk.append({
                'document_id': document_id,
                'index': index,
                'data': data
            })
            if len(chunk) >= chunk_size:
                q = table.insert().values(chunk)
                db.session.execute(q)
                chunk = []

        if len(chunk):
            q = table.insert().values(chunk)
            db.session.execute(q)

    @classmethod
    def find_records(cls, ids):
        if not len(ids):
            return []
        q = db.session.query(cls)
        q = q.filter(cls.id.in_(ids))
        return q

    @classmethod
    def by_index(cls, document_id, index):
        q = db.session.query(cls)
        q = db.session.query(DocumentRecord)
        q = q.filter(cls.document_id == document_id)
        q = q.filter(cls.index == index)
        return q.first()

    def to_proxy(self):
        if self.text is not None:
            proxy = model.make_entity(self.SCHEMA_PAGE)
            proxy.make_id('record', self.id)
            proxy.set('document', self.document_id)
            proxy.set('index', self.index)
            proxy.set('bodyText', self.text)
            return proxy
        else:
            proxy = model.make_entity(self.SCHEMA_ROW)
            proxy.make_id('record', self.id)
            proxy.set('table', self.document_id)
            proxy.set('index', self.index)
            values = [v for (k, v) in sorted(self.data.items())]
            proxy.set('cells', pack_cells(values))
            return proxy

    def to_dict(self):
        data = self.to_dict_dates()
        return data

    def __repr__(self):
        return '<DocumentRecord(%r,%r)>' % (self.document_id, self.index)
