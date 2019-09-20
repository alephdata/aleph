import cgi
import logging
from banal import is_mapping
from normality import slugify
from followthemoney import model
from followthemoney.types import registry
from followthemoney.namespace import Namespace
from followthemoney.util import sanitize_text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm.attributes import flag_modified

from aleph.core import db, cache
from aleph.model.collection import Collection
from aleph.model.common import DatedModel

log = logging.getLogger(__name__)


class Document(db.Model, DatedModel):
    SCHEMA = 'Document'
    SCHEMA_FOLDER = 'Folder'
    SCHEMA_TABLE = 'Table'

    id = db.Column(db.BigInteger, primary_key=True)
    content_hash = db.Column(db.Unicode(65), nullable=True, index=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True, index=True)
    schema = db.Column(db.String(255), nullable=False)
    meta = db.Column(JSONB, default={})

    uploader_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)  # noqa
    parent_id = db.Column(db.BigInteger, db.ForeignKey('document.id'), nullable=True, index=True)  # noqa
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
            text = data.get(prop, self.meta.get(prop))
            self.meta[prop] = sanitize_text(text)

        flag_modified(self, 'meta')

    def delete(self, deleted_at=None):
        db.session.delete(self)

    @classmethod
    def delete_by_collection(cls, collection_id):
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq.delete(synchronize_session=False)

    @classmethod
    def save(cls, collection, parent=None, foreign_id=None,
             content_hash=None, meta=None, uploader_id=None):
        """Try and find a document by various criteria."""
        foreign_id = sanitize_text(foreign_id)

        q = cls.all()
        q = q.filter(Document.collection_id == collection.id)

        if parent is not None:
            q = q.filter(Document.parent_id == parent.id)
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
            document.uploader_id = uploader_id

        if parent is not None:
            document.parent_id = parent.id

        if foreign_id is not None:
            document.foreign_id = foreign_id

        document.content_hash = content_hash
        if content_hash is None:
            document.schema = cls.SCHEMA_FOLDER

        if meta is not None:
            document.update(meta)

        db.session.add(document)
        return document

    @classmethod
    def by_id(cls, document_id, collection_id=None):
        try:
            document_id, _ = Namespace.parse(document_id)
            document_id = int(document_id)
        except Exception:
            return
        q = cls.all()
        q = q.filter(cls.id == document_id)
        if collection_id is not None:
            q = q.filter(cls.collection_id == collection_id)
        return q.first()

    @classmethod
    def by_collection(cls, collection_id=None):
        q = cls.all()
        q = q.filter(cls.collection_id == collection_id)
        return q

    @classmethod
    def cleanup_deleted(cls):
        q = db.session.query(Collection.id)
        q = q.filter(Collection.deleted_at != None)  # noqa
        collection_ids = [c for (c,) in q.all()]
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id.in_(collection_ids))
        pq.delete(synchronize_session=False)

    def to_proxy(self):
        proxy = model.get_proxy({
            'id': str(self.id),
            'schema': self.model,
            'properties': {}
        })
        meta = dict(self.meta)
        headers = meta.pop('headers', {})
        if is_mapping(headers):
            headers = {slugify(k, sep='_'): v for k, v in headers.items()}
        else:
            headers = {}
        proxy.set('contentHash', self.content_hash)
        proxy.set('parent', self.parent_id)
        proxy.set('ancestors', self.ancestors)
        proxy.set('crawler', meta.get('crawler'))
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
        proxy.set('keywords', meta.get('keywords'))
        proxy.set('headers', registry.json.pack(headers), quiet=True)
        proxy.set('authoredAt', meta.get('authored_at'))
        proxy.set('modifiedAt', meta.get('modified_at'))
        proxy.set('publishedAt', meta.get('published_at'))
        proxy.set('retrievedAt', meta.get('retrieved_at'))
        proxy.set('indexUpdatedAt', self.created_at)
        proxy.set('sourceUrl', meta.get('source_url'))
        return proxy

    def __repr__(self):
        return '<Document(%r,%r)>' % (self.id, self.schema)
