import logging
from banal import is_mapping
from followthemoney import model
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm.attributes import flag_modified

from aleph.core import db, cache
from aleph.model.metadata import Metadata
from aleph.model.collection import Collection
from aleph.model.common import DatedModel
from aleph.model.document_record import DocumentRecord
from aleph.model.document_tag import DocumentTag
from aleph.util import filter_texts

log = logging.getLogger(__name__)


class Document(db.Model, DatedModel, Metadata):
    MAX_TAGS = 10000

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

    SCHEMA_MAPPING = {
        'contentHash': 'content_hash',
        'title': 'title',
        'author': 'author',
        'generator': 'generator',
        'crawler': 'crawler',
        'fileSize': 'file_size',
        'fileName': 'file_name',
        'extension': 'extension',
        'encoding': 'encoding',
        'mimeType': 'mime_type',
        'language': 'languages',
        'country': 'countries',
        'date': 'date',
        'authoredAt': 'authored_at',
        'modifiedAt': 'modified_at',
        'publishedAt': 'published_at',
        'retrievedAt': 'retrieved_at',
        'parent': 'parent_id',
        'messageId': 'message_id',
        'inReplyTo': 'in_reply_to',
    }

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
        if self.parent_id is None or not self.parent:
            return []
        key = cache.key('ancestors', self.id)
        ancestors = cache.get_list(key)
        if ancestors is not None:
            return ancestors
        ancestors = self.parent.ancestors
        ancestors.append(self.parent_id)
        cache.set_list(key, ancestors)
        return ancestors

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

    def delete(self, deleted_at=None):
        self.delete_records()
        self.delete_tags()
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

        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq.delete(synchronize_session=False)

    def raw_texts(self):
        yield self.title
        yield self.file_name
        yield self.source_url
        yield self.summary
        yield self.author

        if self.status != self.STATUS_SUCCESS:
            return

        yield self.body_text
        if self.supports_records:
            # iterate over all the associated records.
            pq = db.session.query(DocumentRecord)
            pq = pq.filter(DocumentRecord.document_id == self.id)
            pq = pq.order_by(DocumentRecord.index.asc())
            for record in pq.yield_per(10000):
                yield from record.raw_texts()

    @property
    def texts(self):
        yield from filter_texts(self.raw_texts())

    @classmethod
    def by_keys(cls, parent_id=None, collection_id=None, foreign_id=None,
                content_hash=None):
        """Try and find a document by various criteria."""
        q = cls.all()
        q = q.filter(Document.collection_id == collection_id)

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
            document.collection_id = collection_id

        if parent_id is not None:
            document.parent_id = parent_id

        if foreign_id is not None:
            document.foreign_id = foreign_id

        if content_hash is not None:
            document.content_hash = content_hash

        db.session.add(document)
        return document

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

    @classmethod
    def doc_data_to_schema(cls, data):
        """Convert an existing dict with document information (e.g. from the search
        index) to it's followthemoney form."""
        proxy = model.get_proxy(data)
        for prop, field in cls.SCHEMA_MAPPING.items():
            proxy.add(prop, data.get(field))
        proxy.add('namesMentioned', data.get('names'))
        proxy.add('ibanMentioned', data.get('ibans'))
        proxy.add('ipMentioned', data.get('ips'))
        proxy.add('locationMentioned', data.get('locations'))
        proxy.add('phoneMentioned', data.get('phones'))
        proxy.add('emailMentioned', data.get('email'))
        parent = data.get('parent')
        if is_mapping(parent):
            proxy.add('parent', parent.get('id'))
        return proxy.to_dict()

    def to_proxy(self):
        proxy = model.make_entity(self.model)
        proxy.id = self.id
        for prop, field in self.SCHEMA_MAPPING.items():
            prop = proxy.schema.get(prop)
            if prop is not None:
                values = getattr(self, field)
                proxy.add(prop, values)

        q = db.session.query(DocumentTag)
        q = q.filter(DocumentTag.document_id == self.id)
        q = q.filter(DocumentTag.type.in_(DocumentTag.MAPPING.keys()))
        q = q.order_by(DocumentTag.weight.desc())
        q = q.limit(Document.MAX_TAGS)
        for tag in q.all():
            prop = DocumentTag.MAPPING.get(tag.type)
            if prop is not None:
                proxy.add(prop, tag.text)
        return proxy

    def __repr__(self):
        return '<Document(%r,%r,%r)>' % (self.id, self.schema, self.title)
