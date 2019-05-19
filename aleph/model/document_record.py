import logging
from normality import stringify
from followthemoney import model
from followthemoney.types import registry
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
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

    def to_proxy(self):
        if self.text is not None:
            proxy = model.make_entity(self.SCHEMA_PAGE)
            proxy.make_id('record', self.id)
            proxy.set('document', self.document_id)
            proxy.set('index', self.index)
            proxy.set('bodyText', stringify(self.text))
            return proxy
        else:
            proxy = model.make_entity(self.SCHEMA_ROW)
            proxy.make_id('record', self.id)
            proxy.set('table', self.document_id)
            proxy.set('index', self.index)
            if self.data is not None:
                # sort values by columns
                values = [
                    self.data.get(k) for k in self.document.meta.get('columns')
                ]
                proxy.set('cells', registry.json.pack(values))
            return proxy

    def to_dict(self):
        proxy = self.to_proxy()
        data = proxy.to_full_dict()
        data.update({
            'document_id': self.document_id,
        })
        return data

    def __repr__(self):
        return '<DocumentRecord(%r,%r)>' % (self.document_id, self.index)
