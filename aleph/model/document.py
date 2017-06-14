import logging
from datetime import datetime, timedelta
from normality import ascii_text
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm.attributes import flag_modified

from aleph.core import db
from aleph.model.metadata import Metadata
from aleph.model.validate import validate
from aleph.model.collection import Collection
from aleph.model.reference import Reference
from aleph.model.common import DatedModel
from aleph.model.document_record import DocumentRecord
from aleph.model.document_tag import DocumentTag
from aleph.text import index_form

log = logging.getLogger(__name__)


class Document(db.Model, DatedModel, Metadata):
    _schema = 'document.json#'

    SCHEMA = 'Document'

    TYPE_TEXT = 'text'
    TYPE_TABULAR = 'tabular'
    TYPE_OTHER = 'other'

    STATUS_PENDING = 'pending'
    STATUS_SUCCESS = 'success'
    STATUS_FAIL = 'fail'

    id = db.Column(db.BigInteger, primary_key=True)
    content_hash = db.Column(db.Unicode(65), nullable=True, index=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True)
    type = db.Column(db.Unicode(10), nullable=False, index=True)
    status = db.Column(db.Unicode(10), nullable=True, index=True)
    meta = db.Column(JSONB, default={})

    crawler = db.Column(db.Unicode(), index=True)
    crawler_run = db.Column(db.Unicode())
    error_type = db.Column(db.Unicode(), nullable=True)
    error_message = db.Column(db.Unicode(), nullable=True)

    parent_id = db.Column(db.BigInteger, db.ForeignKey('document.id'), nullable=True)  # noqa
    children = db.relationship('Document', backref=db.backref('parent', uselist=False, remote_side=[id]))  # noqa

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), nullable=False, index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('documents', lazy='dynamic'))  # noqa

    def __init__(self, **kw):
        self.meta = {}
        super(Document, self).__init__(**kw)

    def update(self, data):
        validate(data, self._schema)
        self.title = data.get('title')
        self.summary = data.get('summary')
        self.languages = data.get('languages')
        self.countries = data.get('countries')
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

    def delete_references(self, origin=None):
        pq = db.session.query(Reference)
        pq = pq.filter(Reference.document_id == self.id)
        if origin is not None:
            pq = pq.filter(Reference.origin == origin)
        # pq.delete(synchronize_session='fetch')
        pq.delete()
        db.session.flush()

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

    @classmethod
    def by_keys(cls, parent_id=None, collection=None, foreign_id=None,
                content_hash=None):
        """Try and find a document by various criteria."""
        q = cls.all()

        if collection is not None:
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

    def to_dict(self):
        data = self.to_meta_dict()
        try:
            from flask import request  # noqa
            data['public'] = request.authz.collection_public(self.collection_id)  # noqa
        except:
            data['public'] = None
        data.update({
            'id': self.id,
            'type': self.type,
            'status': self.status,
            'parent_id': self.parent_id,
            'foreign_id': self.foreign_id,
            'content_hash': self.content_hash,
            'crawler': self.crawler,
            'crawler_run': self.crawler_run,
            'error_type': self.error_type,
            'error_message': self.error_message,
            'collection_id': self.collection_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        })
        return data

    def to_index_dict(self):
        data = self.to_dict()
        data['text'] = index_form(self.text_parts())
        data['schema'] = self.SCHEMA
        data['schemata'] = [self.SCHEMA]
        data['name_sort'] = ascii_text(data.get('title'))
        data['title_latin'] = ascii_text(data.get('title'))
        data['summary_latin'] = ascii_text(data.get('summary'))
        data.pop('tables')
        return data

    def __repr__(self):
        return '<Document(%r,%r,%r)>' % (self.id, self.type, self.title)
