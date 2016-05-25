from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model.source import Source


class CrawlerState(db.Model):
    """Report the state of a file being processed."""

    TIMEOUT = timedelta(minutes=60)

    STATUS_OK = 'ok'
    STATUS_FAIL = 'fail'

    id = db.Column(db.BigInteger, primary_key=True)
    crawler_id = db.Column(db.Unicode(), index=True)
    crawler_run = db.Column(db.Unicode(), nullable=True)
    content_hash = db.Column(db.Unicode(65), nullable=True)
    foreign_id = db.Column(db.Unicode, nullable=True)
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
    def store_stub(cls, source_id, crawler_id, crawler_run):
        obj = cls()
        obj.source_id = source_id
        obj.crawler_id = crawler_id
        obj.crawler_run = crawler_run
        obj.error_type = 'init'
        obj.status = cls.STATUS_OK
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

    @classmethod
    def crawler_last_run(cls, crawler_id):
        q = db.session.query(cls.crawler_run, cls.created_at)
        q = q.filter(cls.crawler_id == crawler_id)
        q = q.order_by(cls.created_at.desc())
        q = q.limit(1)
        res = q.first()
        if res is None:
            return None, None
        return (res.crawler_run, res.created_at)

    @classmethod
    def crawler_stats(cls, crawler_id):
        stats = {}
        col = func.count(func.distinct(cls.crawler_run))
        q = db.session.query(col)
        q = q.filter(cls.crawler_id == crawler_id)
        stats['run_count'] = q.scalar()
        last_run_id, last_run_time = cls.crawler_last_run(crawler_id)

        # Check if the crawler was active very recently, if so, don't
        # allow the user to execute a new run right now.
        timeout = (datetime.utcnow() - CrawlerState.TIMEOUT)
        stats['running'] = last_run_time > timeout if last_run_time else False

        q = db.session.query(func.count(func.distinct(cls.foreign_id)))
        q = q.filter(cls.crawler_id == crawler_id)
        for section in ['last', 'all']:
            data = {}
            sq = q
            if section == 'last':
                sq = sq.filter(cls.crawler_run == last_run_id)
            okq = sq.filter(cls.status == cls.STATUS_OK)
            data['ok'] = okq.scalar() if last_run_id else 0
            failq = sq.filter(cls.status == cls.STATUS_FAIL)
            data['fail'] = failq.scalar() if last_run_id else 0
            stats[section] = data
        stats['last']['updated'] = last_run_time
        stats['last']['run_id'] = last_run_id
        return stats

    def to_dict(self):
        return {
            'id': self.id,
            'status': self.status,
            'crawler_id': self.crawler_id,
            'crawler_run': self.crawler_run,
            'content_hash': self.content_hash,
            'foreign_id': self.foreign_id,
            'error_type': self.error_type,
            'error_message': self.error_message,
            'error_details': self.error_details,
            'meta': self.meta,
            'source_id': self.source_id,
            'created_at': self.created_at
        }

    def __repr__(self):
        return '<CrawlerState(%r,%r)>' % (self.id, self.status)

    def __unicode__(self):
        return self.id
