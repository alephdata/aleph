import json
import logging

from aleph.core import db, get_config
from aleph.metadata import Metadata
from aleph.model import Entity, Collection, Document
from aleph.model.common import make_textid
from aleph.ingest import ingest_url, ingest_file
from aleph.logic import update_entity_full, update_collection
from aleph.crawlers.schedule import CrawlerSchedule
from aleph.util import make_tempfile, remove_tempfile

log = logging.getLogger(__name__)


class CrawlerException(Exception):
    pass


class RunLimitException(CrawlerException):
    pass


class Crawler(object):
    DAILY = CrawlerSchedule('daily', days=1)
    WEEKLY = CrawlerSchedule('weekly', weeks=1)
    MONTHLY = CrawlerSchedule('monthly', weeks=4)

    COLLECTION_ID = None
    COLLECTION_LABEL = None
    SCHEDULE = None
    CRAWLER_NAME = None
    RUN_LIMIT = None

    def __init__(self):
        self.incremental = False
        self.crawler_run = make_textid()

    def load_collection(self, data):
        foreign_id = data.get('foreign_id')
        collection = Collection.by_foreign_id(foreign_id)
        if collection is None:
            collection = Collection.create(data)
            db.session.commit()
            update_collection(collection)
        return collection

    @property
    def collection(self):
        if not hasattr(self, '_collection'):
            self._collection = self.load_collection({
                'foreign_id': self.COLLECTION_ID,
                'label': self.COLLECTION_LABEL or self.COLLECTION_ID,
                'managed': True
            })
        db.session.add(self._collection)
        return self._collection

    def crawl(self, **kwargs):
        raise NotImplemented()

    def execute(self, incremental=False, **kwargs):
        # This an emergency flag intended for use when the queue
        # has become too large and needs to drain.
        if get_config('DISABLE_CRAWLERS'):
            log.warning("Crawlers are disabled, skipping: %r", self)
            return

        self.run_count = 0
        try:
            self.incremental = incremental
            self.crawl(**kwargs)
            db.session.commit()
        except RunLimitException:
            log.info("Crawler has reached RUN_LIMIT")
            db.session.commit()
        except Exception as ex:
            log.exception(ex)

    def increment_count(self):
        self.run_count += 1
        if self.RUN_LIMIT is not None:
            if self.run_count > self.RUN_LIMIT:
                raise RunLimitException()

    def skip_incremental(self, foreign_id, content_hash=None):
        if not self.incremental:
            return False
        q = db.session.query(Document.id)
        q = q.filter(Document.collection_id == self.collection.id)
        q = q.filter(Document.foreign_id == unicode(foreign_id))
        if content_hash is not None:
            q = q.filter(Document.content_hash == content_hash)
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

    def save_response(self, res, suffix=None):
        """Store the return data from a requests response to a file."""
        # This must be a streaming response.
        if res.status_code >= 400:
            message = "Error ingesting %r: %r" % (res.url, res.status_code)
            raise CrawlerException(message)
        file_path = make_tempfile(suffix=suffix)
        try:
            with open(file_path, 'w') as fh:
                for chunk in res.iter_content(chunk_size=1024):
                    if chunk:
                        fh.write(chunk)
            return file_path
        except Exception:
            remove_tempfile(file_path)
            raise

    def save_data(self, data):
        """Store a lump object of data to a temporary file."""
        file_path = make_tempfile()
        try:
            with open(file_path, 'w') as fh:
                fh.write(data or '')
            return file_path
        except Exception:
            remove_tempfile(file_path)
            raise

    @classmethod
    def get_id(cls):
        name = cls.__module__ + "." + cls.__name__
        if cls.COLLECTION_ID is not None:
            name = '%s->%s' % (name, cls.COLLECTION_ID)
        return name

    def __repr__(self):
        return '<%s()>' % self.get_id()

    def to_dict(self):
        data = Document.crawler_stats(self.get_id())
        data.update({
            'name': self.CRAWLER_NAME,
            'schedule': self.SCHEDULE,
            'id': self.get_id()
        })
        if self.COLLECTION_ID:
            data.update({
                'collection': self.collection
            })
        return data


class EntityCrawler(Crawler):

    def emit_entity(self, collection, data):
        entity = Entity.save(data, collection, merge=True)
        db.session.commit()
        log.info("Entity [%s]: %s", entity.id, entity.name)
        update_entity_full(entity.id)
        self.increment_count()
        return entity


class DocumentCrawler(Crawler):

    def execute(self, **kwargs):
        db.session.commit()
        super(DocumentCrawler, self).execute(**kwargs)

    def emit_file(self, meta, file_path, move=False):
        ingest_file(self.collection.id, meta.clone(), file_path, move=move)
        self.increment_count()

    def emit_url(self, meta, url):
        ingest_url.delay(self.collection.id, meta.to_attr_dict(), url)
        self.increment_count()
