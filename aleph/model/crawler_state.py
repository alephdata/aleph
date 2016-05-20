from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.source import Source


class CrawlerState(db.Model):
    """Report the state of a file being processed."""

    STATUS_OK = 'ok'
    STATUS_FAIL = 'fail'

    id = db.Column(db.BigInteger, primary_key=True)
    crawler_id = db.Column(db.Unicode(), index=True)
    crawler_run = db.Column(db.Unicode(), nullable=True)
    content_hash = db.Column(db.Unicode(65), nullable=True)
    foreign_id = db.Column(db.Unicode, unique=False, nullable=True)
    status = db.Column(db.Unicode(10), nullable=False)
    error_type = db.Column(db.Unicode(), nullable=True)
    error_message = db.Column(db.Unicode(), nullable=True)
    error_details = db.Column(db.Unicode(), nullable=True)
    meta = db.Column(JSONB)
    source_id = db.Column(db.Integer(), db.ForeignKey('source.id'), index=True)
    source = db.relationship(Source, backref=db.backref('crawl_states', cascade='all, delete-orphan'))  # noqa
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def _from_meta(cls, meta, source_id):
        obj = cls()
        obj.source_id = source_id
        obj.crawler_id = meta.get('crawler')
        obj.crawler_run = meta.get('crawler_run')
        obj.foreign_id = meta.foreign_id
        obj.content_hash = meta.content_hash
        obj.meta = meta.data
        db.session.add(obj)
        return obj

    @classmethod
    def store_ok(cls, meta, source_id):
        obj = cls._from_meta(meta, source_id)
        obj.status = cls.STATUS_OK
        return obj

    @classmethod
    def store_fail(cls, meta, source_id, error_type=None, error_message=None,
                   error_details=None):
        obj = cls._from_meta(meta, source_id)
        obj.status = cls.STATUS_FAIL
        obj.error_type = error_type
        obj.error_message = error_message
        obj.error_details = error_details
        return obj

    def __repr__(self):
        return '<CrawlerState(%r,%r)>' % (self.id, self.status)

    def __unicode__(self):
        return self.id
