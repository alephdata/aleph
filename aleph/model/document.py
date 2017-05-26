import logging
from datetime import datetime, timedelta
from normality import ascii_text
from sqlalchemy import func, or_, and_
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm.attributes import flag_modified

from aleph.core import db
from aleph.metadata import Metadata
from aleph.model.validate import validate
from aleph.model.collection import Collection
from aleph.model.reference import Reference
from aleph.model.common import DatedModel
from aleph.model.document_record import DocumentRecord
from aleph.text import index_form

log = logging.getLogger(__name__)


class Document(db.Model, DatedModel):
    _schema = 'document.json#'

    SCHEMA = 'Document'

    TYPE_TEXT = 'text'
    TYPE_TABULAR = 'tabular'
    TYPE_OTHER = 'other'

    STATUS_PENDING = 'pending'
    STATUS_SUCCESS = 'success'
    STATUS_FAIL = 'fail'

    id = db.Column(db.BigInteger, primary_key=True)
    content_hash = db.Column(db.Unicode(65), nullable=False, index=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True)
    type = db.Column(db.Unicode(10), nullable=False, index=True)
    status = db.Column(db.Unicode(10), nullable=True, index=True)
    _meta = db.Column('meta', JSONB)

    crawler = db.Column(db.Unicode(), index=True)
    crawler_run = db.Column(db.Unicode())
    error_type = db.Column(db.Unicode(), nullable=True)
    error_message = db.Column(db.Unicode(), nullable=True)
    error_details = db.Column(db.Unicode(), nullable=True)

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), nullable=False, index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('documents', lazy='dynamic'))  # noqa

    @property
    def title(self):
        return self.meta.title

    @hybrid_property
    def meta(self):
        self._meta = self._meta or {}
        self._meta['content_hash'] = self.content_hash
        self._meta['foreign_id'] = self.foreign_id
        self._meta['crawler'] = self.crawler
        self._meta['crawler_run'] = self.crawler_run
        return Metadata.from_data(self._meta or {})

    @meta.setter
    def meta(self, meta):
        if isinstance(meta, Metadata):
            self.content_hash = meta.content_hash
            self.foreign_id = meta.foreign_id
            self.crawler = meta.crawler
            self.crawler_run = meta.crawler_run
            meta = meta.to_attr_dict()
        self._meta = meta
        flag_modified(self, '_meta')

    def update(self, data):
        validate(data, self._schema)
        meta = self.meta
        meta.update(data, safe=True)
        self.meta = meta
        db.session.add(self)

    def delete_records(self):
        pq = db.session.query(DocumentRecord)
        pq = pq.filter(DocumentRecord.document_id == self.id)
        pq.delete(synchronize_session='fetch')
        db.session.refresh(self)

    def delete_references(self, origin=None):
        pq = db.session.query(Reference)
        pq = pq.filter(Reference.document_id == self.id)
        if origin is not None:
            pq = pq.filter(Reference.origin == origin)
        pq.delete(synchronize_session='fetch')
        db.session.refresh(self)

    def delete(self, deleted_at=None):
        self.delete_references()
        self.delete_records()
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
        pq = db.session.query(DocumentRecord)
        pq = pq.filter(DocumentRecord.document_id == self.id)
        for record in pq.yield_per(1000):
            for text in record.text_parts():
                yield text

    @classmethod
    def crawler_last_run(cls, crawler_id):
        q = db.session.query(func.max(cls.updated_at))
        q = q.filter(cls.crawler == crawler_id)
        return q.scalar()

    @classmethod
    def is_crawler_active(cls, crawler_id):
        # TODO: add a function to see if a particular crawl is still running
        # this should be defined as having "pending" documents.
        last_run_time = cls.crawler_last_run(crawler_id)
        if last_run_time is None:
            return False
        return last_run_time > (datetime.utcnow() - timedelta(hours=1))

    @classmethod
    def by_meta(cls, collection_id, meta):
        q = cls.all()
        q = q.filter(cls.collection_id == collection_id)
        if meta.foreign_id:
            q = q.filter(cls.foreign_id == meta.foreign_id)
        elif meta.content_hash:
            q = q.filter(cls.content_hash == meta.content_hash)
        else:
            raise ValueError("No unique criterion for document: %s" % meta)

        document = q.first()
        if document is None:
            document = Document()
            document.collection_id = collection_id
            document.foreign_id = meta.foreign_id
            document.content_hash = meta.content_hash
        document.meta = meta
        return document

    @classmethod
    def crawler_stats(cls, crawler_id):
        # Check if the crawler was active very recently, if so, don't
        # allow the user to execute a new run right now.
        stats = {
            'updated': cls.crawler_last_run(crawler_id),
            'running': cls.is_crawler_active(crawler_id)
        }

        q = db.session.query(cls.status, func.count(cls.id))
        q = q.filter(cls.crawler == crawler_id)
        q = q.group_by(cls.status)
        for (status, count) in q.all():
            stats[status] = count
        return stats

    def _add_to_dict(self, data):
        try:
            from flask import request
            source_id = self.collection_id
            data['public'] = request.authz.collection_public(source_id)
        except:
            data['public'] = None
        data.update({
            'id': self.id,
            'type': self.type,
            'status': self.status,
            'error_type': self.error_type,
            'error_message': self.error_message,
            'error_details': self.error_details,
            'collection_id': self.collection_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        })
        return data

    def to_dict(self):
        data = self.meta.to_dict()
        return self._add_to_dict(data)

    def to_index_dict(self):
        data = self.meta.to_index_dict()
        data['text'] = index_form(self.text_parts())
        data['schema'] = self.SCHEMA
        data['schemata'] = [self.SCHEMA]
        data['name_sort'] = ascii_text(data.get('title'))
        data['title_latin'] = ascii_text(data.get('title'))
        data['summary_latin'] = ascii_text(data.get('summary'))
        return self._add_to_dict(data)

    def __repr__(self):
        return '<Document(%r,%r,%r)>' % (self.id, self.type, self.title)
