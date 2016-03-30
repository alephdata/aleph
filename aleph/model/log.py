from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.common import DatedModel

CRAWL = 'crawl'
INGEST = 'ingest'
ANALYZE = 'analyze'
INDEX = 'index'


class ProcessingLog(db.Model, DatedModel):
    """Report any events or errors during processing of documents."""

    id = db.Column(db.BigInteger, primary_key=True)
    operation = db.Column(db.Unicode, nullable=True, index=True)
    component = db.Column(db.Unicode, nullable=True, index=True)
    source_location = db.Column(db.Unicode, nullable=True, index=True)
    content_hash = db.Column(db.Unicode(65), nullable=True, index=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True)
    source_id = db.Column(db.Integer, nullable=True)
    document_id = db.Column(db.BigInteger, nullable=True)
    meta = db.Column(JSONB)
    error_type = db.Column(db.Unicode, nullable=True)
    error_message = db.Column(db.Unicode, nullable=True)
    error_details = db.Column(db.Unicode, nullable=True)

    @classmethod
    def log(cls, operation, component=None, source_location=None,
            content_hash=None, foreign_id=None, source_id=None,
            document_id=None, meta=None, error_type=None,
            error_message=None, error_details=None):

        meta = meta or {}
        obj = ProcessingLog()
        obj.operation = operation
        obj.component = component
        obj.source_id = source_id
        obj.document_id = document_id
        obj.meta = meta

        source_location = source_location or meta.get('source_path') or \
            meta.get('source_url') or meta.get('file_name')
        obj.source_location = source_location
        obj.content_hash = content_hash or meta.get('content_hash')
        obj.foreign_id = foreign_id or meta.get('foreign_id')

        obj.error_type = error_type
        obj.error_message = error_message
        obj.error_details = error_details

        session = db.create_scoped_session()
        session.add(obj)
        session.commit()
        session.remove()

    def __repr__(self):
        return '<ProcessingLog(%r,%r)>' % (self.id, self.content_hash)

    def __unicode__(self):
        return self.id
