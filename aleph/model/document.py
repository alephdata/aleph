import logging
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm.attributes import flag_modified

from aleph.core import db
from aleph.model.metadata import Metadata
from aleph.model.collection import Collection
from aleph.model.match import Match
from aleph.model.common import DatedModel
from aleph.model.document_record import DocumentRecord
from aleph.model.document_tag import DocumentTag

log = logging.getLogger(__name__)


class Document(db.Model, DatedModel, Metadata):
    SCHEMA = 'Document'

    TYPE_TEXT = 'text'
    TYPE_TABULAR = 'tabular'
    TYPE_OTHER = 'other'

    STATUS_PENDING = 'pending'
    STATUS_SUCCESS = 'success'
    STATUS_FAIL = 'fail'

    id = db.Column(db.BigInteger, primary_key=True)
    content_hash = db.Column(db.Unicode(65), nullable=True, index=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True, index=True)
    type = db.Column(db.Unicode(10), nullable=False)
    status = db.Column(db.Unicode(10), nullable=True)
    meta = db.Column(JSONB, default={})

    crawler = db.Column(db.Unicode())
    crawler_run = db.Column(db.Unicode())
    error_message = db.Column(db.Unicode(), nullable=True)

    uploader_id = db.Column(db.Integer,
                            db.ForeignKey('role.id'),
                            nullable=True)

    parent_id = db.Column(db.BigInteger,
                          db.ForeignKey('document.id'),
                          nullable=True,
                          index=True)
    children = db.relationship('Document',
                               lazy='dynamic',
                               backref=db.backref('parent',
                                                  uselist=False,
                                                  remote_side=[id]))

    collection_id = db.Column(db.Integer,
                              db.ForeignKey('collection.id'),
                              nullable=False,
                              index=True)
    collection = db.relationship(Collection,
                                 backref=db.backref('documents',
                                                    lazy='dynamic'))

    def __init__(self, **kw):
        self.meta = {}
        super(Document, self).__init__(**kw)

    def update(self, data):
        self.title = data.get('title')
        self.summary = data.get('summary')
        self.languages = data.get('languages', [])
        self.countries = data.get('countries', [])
        self.keywords = data.get('keywords', [])
        db.session.add(self)

    def update_meta(self):
        flag_modified(self, 'meta')

    def delete_records(self):
        pq = db.session.query(DocumentRecord)
        pq = pq.filter(DocumentRecord.document_id == self.id)
        # pq.delete(synchronize_session='fetch')
        pq.delete()
        db.session.flush()

    def delete_tags(self):
        pq = db.session.query(DocumentTag)
        pq = pq.filter(DocumentTag.document_id == self.id)
        # pq.delete(synchronize_session='fetch')
        pq.delete()
        db.session.flush()

    def delete_matches(self):
        pq = db.session.query(Match)
        pq = pq.filter(Match.document_id == self.id)
        pq.delete()
        db.session.flush()

    def delete(self, deleted_at=None):
        self.delete_records()
        self.delete_tags()
        self.delete_matches()
        db.session.delete(self)

    def insert_records(self, sheet, iterable, chunk_size=1000):
        chunk = []
        for index, data in enumerate(iterable):
            chunk.append({
                'document_id': self.id,
                'index': index,
                'sheet': sheet,
                'data': data
            })
            if len(chunk) >= chunk_size:
                db.session.bulk_insert_mappings(DocumentRecord, chunk)
                chunk = []

        if len(chunk):
            db.session.bulk_insert_mappings(DocumentRecord, chunk)

    def text_parts(self):
        if self.title:
            yield self.title
        if self.summary:
            yield self.summary
        pq = db.session.query(DocumentRecord)
        pq = pq.filter(DocumentRecord.document_id == self.id)
        for record in pq.yield_per(1000):
            for text in record.text_parts():
                yield text

    @classmethod
    def pending_count(cls, collection_id=None):
        q = db.session.query(func.count(cls.id))
        q = q.filter(cls.status == cls.STATUS_PENDING)
        if collection_id is not None:
            q = q.filter(cls.collection_id == collection_id)
        return q.scalar()

    @classmethod
    def by_keys(cls, parent_id=None, collection=None, foreign_id=None,
                content_hash=None):
        """Try and find a document by various criteria."""
        q = cls.all()
        q = q.filter(Document.collection_id == collection.id)

        if parent_id is not None:
            q = q.filter(Document.parent_id == parent_id)

        if foreign_id is not None:
            q = q.filter(Document.foreign_id == foreign_id)
        elif content_hash is not None:
            q = q.filter(Document.content_hash == content_hash)
        else:
            raise ValueError("No unique criterion for document.")

        document = q.first()
        if document is None:
            document = cls()
            document.type = cls.TYPE_OTHER
            document.collection_id = collection.id
            document.collection = collection
            document.parent_id = parent_id
            document.foreign_id = foreign_id
            document.content_hash = content_hash
            document.status = document.STATUS_PENDING
            db.session.add(document)
        return document

    def __repr__(self):
        return '<Document(%r,%r,%r)>' % (self.id, self.type, self.title)
