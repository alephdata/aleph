import logging
from tempfile import NamedTemporaryFile

from aleph.core import db
from aleph.metadata import Metadata
from aleph.model import Source, Document, Entity, Collection
from aleph.ext import get_crawlers
from aleph.ingest import ingest_url, ingest_file
from aleph.index import index_entity, delete_entity
from aleph.analyze import analyze_terms

log = logging.getLogger(__name__)


class Crawler(object):

    def __init__(self, base_meta=None):
        self.base_meta = base_meta or {}

    def crawl(self, **kwargs):
        raise NotImplemented()

    def execute(self, **kwargs):
        try:
            self.crawl(**kwargs)
            self.finalize()
        except Exception as ex:
            log.exception(ex)

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
        q = Document.all_ids().filter(Document.source_id == source.id)
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
            fh.write(content.encode('utf-8'))
            ingest_file(source.id, meta.clone(), fh.name)

    def emit_file(self, source, meta, file_path, move=False):
        db.session.commit()
        ingest_file(source.id, meta.clone(), file_path, move=move)

    def finalize(self):
        pass

    def __repr__(self):
        return '<%s()>' % self.__class__.__name__


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
        index_entity(entity)
        log.info("Entity [%s]: %s", entity.id, entity.name)
        self.entity_cache[collection.id].append(entity)
        return entity

    def emit_collection(self, collection):
        db.session.commit()
        entities = self.entity_cache.pop(collection.id, [])

        for entity in collection.entities:
            if entity not in entities:
                entity.delete()
                delete_entity(entity.id)

        terms = set()
        for entity in entities:
            terms.update(entity.terms)
        analyze_terms(terms)
