from __future__ import absolute_import
import logging
import metafolder

from aleph.core import db
from aleph.model import Permission, Role, Collection
from aleph.ingest import ingest_file
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


class MetaFolderCrawler(Crawler):

    name = 'metafolder'

    def normalize_metadata(self, item):
        meta = self.make_meta(item.meta)
        if not item.meta.get('foreign_id'):
            meta.foreign_id = item.identifier
        meta.dates = item.meta.get('dates', [])
        meta.countries = item.meta.get('countries', [])
        meta.languages = item.meta.get('languages', [])
        meta.keywords = item.meta.get('keywords', [])
        return meta

    def crawl_item(self, item):
        coll_data = item.meta.get('source', {})
        coll_fk = coll_data.pop('foreign_id')
        if coll_fk is None:
            raise ValueError("No foreign_id for collection given: %r" % item)
        if coll_fk not in self.collections:
            label = coll_data.get('label', coll_fk)
            self.collections[coll_fk] = Collection.create({
                'foreign_id': coll_fk,
                'label': label,
                'managed': True
            })
            if coll_data.get('public'):
                Permission.grant_foreign(self.collections[coll_fk],
                                         Role.SYSTEM_GUEST,
                                         True, False)
            db.session.commit()

        log.info('Import: %r', item.identifier)
        meta = self.normalize_metadata(item)
        ingest_file(self.collections[coll_fk].id, meta,
                    item.data_path, move=False)

    def crawl(self, folder):
        mf = metafolder.open(folder)
        self.collections = {}
        for item in mf:
            self.crawl_item(item)
