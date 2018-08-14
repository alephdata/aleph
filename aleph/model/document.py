import logging
from followthemoney import model
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
    SCHEMA_FOLDER = 'Folder'
    SCHEMA_PACKAGE = 'Package'
    SCHEMA_WORKBOOK = 'Workbook'
    SCHEMA_TEXT = 'PlainText'
    SCHEMA_HTML = 'HyperText'
    SCHEMA_PDF = 'Pages'
    SCHEMA_IMAGE = 'Image'
    SCHEMA_AUDIO = 'Audio'
    SCHEMA_VIDEO = 'Video'
    SCHEMA_TABLE = 'Table'
    SCHEMA_EMAIL = 'Email'

    STATUS_PENDING = 'pending'
    STATUS_SUCCESS = 'success'
    STATUS_FAIL = 'fail'

    id = db.Column(db.BigInteger, primary_key=True)
    content_hash = db.Column(db.Unicode(65), nullable=True, index=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True, index=True)
    schema = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Unicode(10), nullable=True)
    meta = db.Column(JSONB, default={})
    error_message = db.Column(db.Unicode(), nullable=True)
    body_text = db.Column(db.Unicode(), nullable=True)
    body_raw = db.Column(db.Unicode(), nullable=True)

    uploader_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)  # noqa
    parent_id = db.Column(db.BigInteger, db.ForeignKey('document.id'), nullable=True, index=True)  # noqa
    children = db.relationship('Document', lazy='dynamic', backref=db.backref('parent', uselist=False, remote_side=[id]))   # noqa
    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), nullable=False, index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('documents', lazy='dynamic'))  # noqa

    def __init__(self, **kw):
        self.meta = {}
        super(Document, self).__init__(**kw)

    @property
    def model(self):
        return model.get(self.schema)

    @property
    def name(self):
        if self.title is not None:
            return self.title
        if self.file_name is not None:
            return self.file_name
        if self.source_url is not None:
            return self.source_url
        if self.content_hash is not None:
            return self.content_hash

    @property
    def supports_records(self):
        # Slightly unintuitive naming: this just checks the document type,
        # not if there actually are any records.
        return self.schema in [self.SCHEMA_PDF, self.SCHEMA_TABLE]

    @property
    def supports_pages(self):
        return self.schema == self.SCHEMA_PDF

    @property
    def supports_nlp(self):
        structural = [
            Document.SCHEMA,
            Document.SCHEMA_PACKAGE,
            Document.SCHEMA_FOLDER,
            Document.SCHEMA_WORKBOOK,
            Document.SCHEMA_VIDEO,
            Document.SCHEMA_AUDIO,
        ]
        return self.schema not in structural

    @property
    def ancestors(self):
        if self.parent_id is not None and self.parent:
            ids = self.parent.ancestors
            ids.append(self.parent_id)
            return ids
        return []

    def update(self, data):
        props = ('title', 'summary', 'author', 'crawler', 'source_url',
                 'file_name', 'mime_type', 'headers', 'date', 'authored_at',
                 'modified_at', 'published_at', 'retrieved_at', 'languages',
                 'countries', 'keywords')
        for prop in props:
            value = data.get(prop, self.meta.get(prop))
            setattr(self, prop, value)
        db.session.add(self)

    def update_meta(self):
        flag_modified(self, 'meta')

    def delete_records(self):
        pq = db.session.query(DocumentRecord)
        pq = pq.filter(DocumentRecord.document_id == self.id)
        pq.delete()
        db.session.flush()

    def delete_tags(self):
        pq = db.session.query(DocumentTag)
        pq = pq.filter(DocumentTag.document_id == self.id)
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

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at=None):
        documents = db.session.query(cls.id)
        documents = documents.filter(cls.collection_id == collection_id)
        documents = documents.subquery()

        pq = db.session.query(DocumentRecord)
        pq = pq.filter(DocumentRecord.document_id.in_(documents))
        pq.delete(synchronize_session=False)

        pq = db.session.query(DocumentTag)
        pq = pq.filter(DocumentTag.document_id.in_(documents))
        pq.delete(synchronize_session=False)

        pq = db.session.query(Match)
        pq = pq.filter(Match.document_id.in_(documents))
        pq.delete(synchronize_session=False)

        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq.delete(synchronize_session=False)

    @property
    def raw_texts(self):
        yield self.title
        yield self.file_name
        yield self.source_url
        yield self.summary
        yield self.author
        yield self.generator
        if self.status != self.STATUS_SUCCESS:
            return

        yield self.body_text
        if self.supports_records:
            # iterate over all the associated records.
            pq = db.session.query(DocumentRecord)
            pq = pq.filter(DocumentRecord.document_id == self.id)
            pq = pq.order_by(DocumentRecord.index.asc())
            for record in pq.yield_per(10000):
                for text in record.texts:
                    yield text

    @property
    def texts(self):
        for text in self.raw_texts:
            if not isinstance(text, str):
                continue
            if not len(text):
                continue
            try:
                # try to exclude numeric data from
                # spreadsheets
                float(text)
                continue
            except Exception:
                pass
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
            document.schema = cls.SCHEMA
            document.collection_id = collection.id
            document.collection = collection

        if parent_id is not None:
            document.parent_id = parent_id

        if foreign_id is not None:
            document.foreign_id = foreign_id

        if content_hash is not None:
            document.content_hash = content_hash

        db.session.add(document)
        return document

    @classmethod
    def by_parent(cls, parent):
        q = cls.all()
        q = q.filter(Document.parent_id == parent.id)
        return q

    @classmethod
    def by_id(cls, id, collection_id=None):
        if id is None:
            return
        q = cls.all()
        q = q.filter(cls.id == id)
        if collection_id is not None:
            q = q.filter(cls.collection_id == collection_id)
        return q.first()

    @classmethod
    def find_ids(cls, collection_id=None, failed_only=False):
        q = cls.all_ids()
        if collection_id is not None:
            q = q.filter(cls.collection_id == collection_id)
        if failed_only:
            q = q.filter(cls.status != cls.STATUS_SUCCESS)
        q = q.order_by(cls.id.asc())
        return q

    def __repr__(self):
        return '<Document(%r,%r,%r)>' % (self.id, self.schema, self.title)
