import logging
from hashlib import sha1

from sqlalchemy import func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm.attributes import flag_modified

from aleph.core import db
from aleph.metadata import Metadata
from aleph.model.source import Source
from aleph.model.common import DatedModel

log = logging.getLogger(__name__)


class Document(db.Model, DatedModel):
    TYPE_TEXT = 'text'
    TYPE_TABULAR = 'tabular'
    TYPE_OTHER = 'other'

    id = db.Column(db.BigInteger, primary_key=True)
    content_hash = db.Column(db.Unicode(65), nullable=False, index=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True)
    type = db.Column(db.Unicode(10), nullable=False, index=True)
    source_id = db.Column(db.Integer(), db.ForeignKey('source.id'), index=True)
    source = db.relationship(Source, backref=db.backref('documents', lazy='dynamic', cascade='all, delete-orphan'))  # noqa
    _meta = db.Column('meta', JSONB)

    @property
    def title(self):
        return self.meta.title

    @hybrid_property
    def meta(self):
        self._meta = self._meta or {}
        self._meta['content_hash'] = self.content_hash
        self._meta['foreign_id'] = self.foreign_id
        return Metadata(data=self._meta or {})

    @meta.setter
    def meta(self, meta):
        if isinstance(meta, Metadata):
            self.content_hash = meta.content_hash
            self.foreign_id = meta.foreign_id
            meta = meta.data
        self._meta = meta
        flag_modified(self, '_meta')

    def delete_pages(self):
        pq = db.session.query(DocumentPage)
        pq = pq.filter(DocumentPage.document_id == self.id)
        pq.delete(synchronize_session='fetch')
        db.session.refresh(self)

    def delete_records(self):
        pq = db.session.query(DocumentRecord)
        pq = pq.filter(DocumentRecord.document_id == self.id)
        pq.delete(synchronize_session='fetch')
        db.session.refresh(self)

    def insert_records(self, sheet, iterable, chunk_size=1000):
        chunk = []
        for i, data in enumerate(iterable):
            chunk.append({
                'document_id': self.id,
                'row_id': i,
                'sheet': sheet,
                'data': data
            })
            if len(chunk) >= chunk_size:
                db.session.bulk_insert_mappings(DocumentRecord, chunk)
                chunk = []

        if len(chunk):
            db.session.bulk_insert_mappings(DocumentRecord, chunk)

    @classmethod
    def get_max_id(cls):
        q = db.session.query(func.max(cls.id))
        return q.scalar()

    def __repr__(self):
        return '<Document(%r,%r,%r)>' % (self.id, self.type, self.meta.title)

    def _add_to_dict(self, data):
        data.update({
            'id': self.id,
            'type': self.type,
            'source_id': self.source_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        })
        return data

    def to_dict(self):
        data = self.meta.to_dict()
        return self._add_to_dict(data)

    def to_index_dict(self):
        data = self.meta.to_index_dict()
        return self._add_to_dict(data)


class DocumentPage(db.Model):

    id = db.Column(db.BigInteger, primary_key=True)
    number = db.Column(db.Integer(), nullable=False)
    text = db.Column(db.Unicode(), nullable=False)
    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'))
    document = db.relationship(Document, backref=db.backref('pages', cascade='all, delete-orphan'))  # noqa

    def __repr__(self):
        return '<DocumentPage(%r,%r)>' % (self.document_id, self.number)

    def text_parts(self):
        """Utility method to get all text snippets in a record."""
        if self.text is not None and len(self.text):
            yield self.text

    def to_dict(self):
        return {
            'id': self.id,
            'number': self.number,
            'text': self.text,
            'document_id': self.document_id
        }


class DocumentRecord(db.Model):

    id = db.Column(db.BigInteger, primary_key=True)
    sheet = db.Column(db.Integer, nullable=False)
    row_id = db.Column(db.Integer, nullable=False)
    data = db.Column(JSONB)
    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'))
    document = db.relationship(Document, backref=db.backref('records', cascade='all, delete-orphan'))  # noqa

    @property
    def tid(self):
        tid = sha1(str(self.document_id))
        tid.update(str(self.sheet))
        tid.update(str(self.row_id))
        return tid.hexdigest()

    @property
    def text(self):
        if self.data is None:
            return []
        text = [t for t in self.data.values() if t is not None]
        return list(set(text))

    def text_parts(self):
        """Utility method to get all text snippets in a record."""
        for value in self.data.values():
            if isinstance(value, basestring) and len(value):
                yield value

    def __repr__(self):
        return '<DocumentRecord(%r,%r)>' % (self.document_id, self.row_id)
