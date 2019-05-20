import cgi
import logging
from normality import slugify
from followthemoney import model
from followthemoney.types import registry
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm.attributes import flag_modified

from aleph.core import db, cache
from aleph.model.metadata import Metadata
from aleph.model.collection import Collection
from aleph.model.common import DatedModel

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
    def ancestors(self):
        if self.parent_id is None:
            return []
        key = cache.key('ancestors', self.id)
        ancestors = cache.get_list(key)
        if len(ancestors):
            return ancestors
        parent_key = cache.key('ancestors', self.parent_id)
        ancestors = cache.get_list(parent_key)
        if not len(ancestors):
            ancestors = []
            parent = Document.by_id(self.parent_id)
            if parent is not None:
                ancestors = parent.ancestors
        ancestors.append(self.parent_id)
        if self.model.is_a(model.get(self.SCHEMA_FOLDER)):
            cache.set_list(key, ancestors, expire=cache.EXPIRE)
        return ancestors

    def update(self, data):
        props = ('title', 'summary', 'author', 'crawler', 'source_url',
                 'file_name', 'mime_type', 'headers', 'date', 'authored_at',
                 'modified_at', 'published_at', 'retrieved_at', 'languages',
                 'countries', 'keywords')
        for prop in props:
            self.meta[prop] = data.get(prop, self.meta.get(prop))
        flag_modified(self, 'meta')

    def delete(self, deleted_at=None):
        self.delete_records()
        self.delete_tags()
        db.session.delete(self)

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at=None):
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq.delete(synchronize_session=False)

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
    def by_collection(cls, collection_id=None):
        q = cls.all()
        q = q.filter(cls.collection_id == collection_id)
        return q

    def to_proxy(self):
        proxy = model.get_proxy({
            'id': str(self.id),
            'schema': self.model,
            'properties': {}
        })
        meta = dict(self.meta)
        headers = meta.pop('headers', {})
        headers = {slugify(k, sep='_'): v for k, v in headers.items()}
        proxy.set('contentHash', self.content_hash)
        proxy.set('parent', self.parent_id)
        proxy.set('ancestors', self.ancestors)
        proxy.set('sourceUrl', meta.get('source_url'))
        proxy.set('title', meta.get('title'))
        proxy.set('fileName', meta.get('file_name'))
        if not proxy.has('fileName'):
            disposition = headers.get('content_disposition')
            if disposition is not None:
                _, attrs = cgi.parse_header(disposition)
                proxy.set('fileName', attrs.get('filename'))
        proxy.set('mimeType', meta.get('mime_type'))
        if not proxy.has('mimeType'):
            proxy.set('mimeType', headers.get('content_type'))
        proxy.set('language', meta.get('languages'))
        proxy.set('country', meta.get('countries'))
        proxy.set('headers', registry.json.pack(headers), quiet=True)
        proxy.set('authoredAt', meta.get('authored_at'))
        proxy.set('modifiedAt', meta.get('modified_at'))
        proxy.set('publishedAt', meta.get('published_at'))
        proxy.set('retrievedAt', meta.get('retrieved_at'))
        proxy.set('sourceUrl', meta.get('source_url'))
        return proxy

    def __repr__(self):
        return '<Document(%r,%r)>' % (self.id, self.schema)
