import logging
from datetime import datetime

from aleph.core import db
from aleph.model.common import TimeStampedModel

log = logging.getLogger(__name__)


class CrawlState(db.Model, TimeStampedModel):
    id = db.Column(db.Integer, primary_key=True)
    tag = db.Column(db.Unicode, nullable=False, index=True)
    source = db.Column(db.Unicode, nullable=True)

    def __repr__(self):
        return '<CrawlState(%r, %r)>' % (self.source, self.tag)

    def __unicode__(self):
        return self.tag

    @classmethod
    def check(cls, tag):
        return db.session.query(cls).filter_by(tag=tag).count() > 0

    @classmethod
    def create(cls, source, tag):
        crawl_state = cls()
        crawl_state.source = source.slug
        crawl_state.tag = tag
        db.session.add(crawl_state)

    @classmethod
    def flush(cls, source):
        q = db.session.query(cls).filter_by(source=unicode(source))
        q.delete()
