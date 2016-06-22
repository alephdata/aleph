import os
import json
import logging
from tempfile import mkstemp

from aleph.core import db
from aleph.metadata import Metadata
from aleph.model import Entity, Collection, CrawlerState
from aleph.model.common import make_textid
from aleph.ingest import ingest_url, ingest_file
from aleph.logic import update_entity_full
from aleph.crawlers.schedule import CrawlerSchedule

log = logging.getLogger(__name__)


class CrawlerException(Exception):
    pass


class Crawler(object):
    DAILY = CrawlerSchedule('daily', days=1)
    WEEKLY = CrawlerSchedule('weekly', weeks=1)
    MONTHLY = CrawlerSchedule('monthly', weeks=4)

    COLLECTION_ID = None
    COLLECTION_LABEL = None
    SCHEDULE = None

    def __init__(self):
        self.incremental = False
        self.crawler_run = make_textid()

    @property
    def collection(self):
        if not hasattr(self, '_collection'):
            self._collection = Collection.create({
                'foreign_id': self.COLLECTION_ID,
                'label': self.COLLECTION_LABEL or self.COLLECTION_ID
            })
            db.session.commit()
        db.session.add(self._collection)
        return self._collection

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
        q = q.filter(CrawlerState.collection_id == self.collection.id)
        q = q.filter(CrawlerState.foreign_id == unicode(foreign_id))
        if content_hash is not None:
            q = q.filter(CrawlerState.content_hash == content_hash)
        skip = q.count() > 0
        if skip:
            log.info("Skip [%s]: %s", self.get_id(), foreign_id)
        return skip

    def make_meta(self, data={}):
        data = json.loads(json.dumps(data))
        meta = Metadata.from_data(data)
        meta.crawler = self.get_id()
        meta.crawler_run = self.crawler_run
        return meta

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
        if hasattr(cls, 'COLLECTION_ID'):
            name = '%s->%s' % (name, cls.COLLECTION_ID)
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

    def execute(self, **kwargs):
        CrawlerState.store_stub(self.collection.id,
                                self.get_id(),
                                self.crawler_run)
        db.session.commit()
        super(DocumentCrawler, self).execute(**kwargs)

    def emit_file(self, meta, file_path, move=False):
        ingest_file(self.collection.id, meta.clone(), file_path, move=move)

    def emit_url(self, meta, url):
        ingest_url.delay(self.collection.id, meta.to_attr_dict(), url)

    def to_dict(self):
        data = CrawlerState.crawler_stats(self.get_id())
        data.update({
            'collection': self.collection,
            'collection_id': self.COLLECTION_ID,
            'collection_label': self.COLLECTION_LABEL or self.COLLECTION_ID,
            'name': self.CRAWLER_NAME,
            'schedule': self.SCHEDULE,
            'id': self.get_id()
        })
        return data
