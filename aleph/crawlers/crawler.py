import logging
from tempfile import NamedTemporaryFile

from aleph.core import db
from aleph.model import Metadata, Source, Document
from aleph.ext import get_crawlers
from aleph.ingest import ingest_url, ingest_file
from aleph.analyze import analyze_terms
from aleph.alerts import check_alerts

log = logging.getLogger(__name__)


class Crawler(object):

    def __init__(self, base_meta=None):
        self.base_meta = base_meta or {}

    def crawl(self, **kwargs):
        raise NotImplemented()

    @property
    def name(self):
        for name, cls in get_crawlers().items():
            if isinstance(self, cls):
                return name

    def create_source(self, **data):
        if 'foreign_id' not in data:
            data['foreign_id'] = self.name
        return Source.create(data)

    def metadata(self):
        meta = {
            'crawler': self.__class__.__name__,
            'crawler_name': self.name
        }
        meta.update(self.base_meta)
        return Metadata(data=meta)

    def foreign_id_exists(self, source, foreign_id):
        q = db.session.query(Document.id)
        q = q.filter(Document.source_id == source.id)
        q = q.filter(Document.foreign_id == foreign_id)
        exists = q.first() is not None
        if exists:
            log.info("Foreign ID exists (%s): %s", source, foreign_id)
        return exists

    def emit_url(self, source, meta, url):
        db.session.commit()
        ingest_url.delay(source.id, meta.clone().data, url)

    def emit_content(self, source, meta, content):
        db.session.commit()
        with NamedTemporaryFile() as fh:
            fh.write(content)
            ingest_file(source.id, meta.clone(), fh.name)

    def emit_file(self, source, meta, file_path, move=False):
        db.session.commit()
        ingest_file(source.id, meta.clone(), file_path, move=move)

    def emit_watchlist(self, watchlist, terms):
        db.session.commit()
        log.debug("Changed terms: %r", terms)
        analyze_terms(terms)

    def finalize(self):
        check_alerts.delay()

    def __repr__(self):
        return '<%s()>' % self.__class__.__name__
