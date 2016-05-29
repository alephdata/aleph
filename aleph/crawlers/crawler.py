import os
import json
import logging
from tempfile import mkstemp

from aleph.core import db
from aleph.metadata import Metadata
from aleph.model import Source, Entity, Collection, CrawlerState
from aleph.model.common import make_textid
from aleph.ingest import ingest_url, ingest_file
from aleph.entities import update_entity_full
from aleph.crawlers.schedule import CrawlerSchedule

log = logging.getLogger(__name__)


class CrawlerException(Exception):
    pass


class Crawler(object):
    DAILY = CrawlerSchedule('daily', days=1)
    WEEKLY = CrawlerSchedule('weekly', weeks=1)
    MONTHLY = CrawlerSchedule('monthly', weeks=4)

    def __init__(self):
        self.incremental = False
        self.crawler_run = make_textid()

    def crawl(self, **kwargs):
        raise NotImplemented()

    def execute(self, incremental=False, **kwargs):
        try:
            self.incremental = incremental
            self.crawl(**kwargs)
            db.session.commit()
        except Exception as ex:
            log.exception(ex)

    def skip_incremental(self, foreign_id, content_hash=None):
        if not self.incremental:
            return False
        q = db.session.query(CrawlerState.id)
        q = q.filter(CrawlerState.source_id == self.source.id)
        q = q.filter(CrawlerState.foreign_id == unicode(foreign_id))
        if content_hash is not None:
            q = q.filter(CrawlerState.content_hash == content_hash)
        skip = q.count() > 0
        if skip:
            log.info("Skip [%s]: %s", self.get_id(), foreign_id)
        return skip

    def make_meta(self, data={}):
        data = json.loads(json.dumps(data))
        data['crawler'] = self.get_id()
        data['crawler_run'] = self.crawler_run
        return Metadata(data=data)

    def save_response(self, res):
        """Store the return data from a requests response to a file."""
        # This must be a streaming response.
        if res.status_code >= 400:
            message = "Error ingesting %r: %r" % (res.url, res.status_code)
            raise CrawlerException(message)
        fh, file_path = mkstemp()
        try:
            fh = os.fdopen(fh, 'w')
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)
            fh.close()
            return file_path
        except Exception:
            if os.path.isfile(file_path):
                os.unlink(file_path)
            raise

    def save_data(self, data):
        """Store a lump object of data to a temporary file."""
        fh, file_path = mkstemp()
        try:
            fh = os.fdopen(fh, 'w')
            fh.write(data)
            fh.close()
            return file_path
        except Exception:
            if os.path.isfile(file_path):
                os.unlink(file_path)
            raise

    @classmethod
    def get_id(cls):
        name = cls.__module__ + "." + cls.__name__
        if hasattr(cls, 'SOURCE_ID'):
            name = '%s->%s' % (name, cls.SOURCE_ID)
        return name

    def __repr__(self):
        return '<%s()>' % self.get_id()


class EntityCrawler(Crawler):

    def find_collection(self, foreign_id, data):
        collection = Collection.by_foreign_id(foreign_id, data)
        if not hasattr(self, 'entity_cache'):
            self.entity_cache = {}
        self.entity_cache[collection.id] = []
        db.session.flush()
        return collection

    def emit_entity(self, collection, data):
        data['collections'] = [collection]
        entity = Entity.save(data, merge=True)
        db.session.flush()
        update_entity_full.delay(entity.id)
        log.info("Entity [%s]: %s", entity.id, entity.name)
        self.entity_cache[collection.id].append(entity)
        return entity

    def emit_collection(self, collection):
        db.session.commit()
        entities = self.entity_cache.pop(collection.id, [])

        deleted_ids = []
        for entity in collection.entities:
            if entity not in entities:
                entity.delete()
                deleted_ids.append(entity.id)

        db.session.commit()
        for entity_id in deleted_ids:
            update_entity_full.delay(entity_id)


class DocumentCrawler(Crawler):
    SOURCE_ID = None
    SOURCE_LABEL = None
    SCHEDULE = None

    @property
    def source(self):
        if not hasattr(self, '_source'):
            self._source = Source.create({
                'foreign_id': self.SOURCE_ID,
                'label': self.SOURCE_LABEL or self.SOURCE_ID
            })
            db.session.commit()
        db.session.add(self._source)
        return self._source

    def execute(self, **kwargs):
        CrawlerState.store_stub(self.source.id,
                                self.get_id(),
                                self.crawler_run)
        db.session.commit()
        super(DocumentCrawler, self).execute(**kwargs)

    def emit_file(self, meta, file_path, move=False):
        ingest_file(self.source.id, meta.clone(), file_path, move=move)

    def emit_url(self, meta, url):
        ingest_url.delay(self.source.id, meta.clone().data, url)

    def to_dict(self):
        data = CrawlerState.crawler_stats(self.get_id())
        data.update({
            'source': self.source,
            'source_id': self.SOURCE_ID,
            'source_label': self.SOURCE_LABEL or self.SOURCE_ID,
            'name': self.CRAWLER_NAME,
            'schedule': self.SCHEDULE,
            'id': self.get_id()
        })
        return data
