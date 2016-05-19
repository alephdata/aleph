from __future__ import absolute_import
import logging
import metafolder

from aleph.core import db
from aleph.model import Permission, Role, Source
from aleph.ingest import ingest_file
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


class MetaFolderCrawler(Crawler):

    name = 'metafolder'

    def normalize_metadata(self, item):
        meta = self.make_meta(item.meta)
        if not item.meta.get('foreign_id'):
            meta['foreign_id'] = item.identifier
        meta.dates = item.meta.get('dates', [])
        meta.countries = item.meta.get('countries', [])
        meta.languages = item.meta.get('languages', [])
        meta.keywords = item.meta.get('keywords', [])
        return meta

    def crawl_item(self, item, source):
        source_data = item.meta.get('source', {})
        source_fk = source_data.pop('foreign_id', source)
        if source_fk is None:
            raise ValueError("No foreign_id for source given: %r" % item)
        if source_fk not in self.sources:
            label = source_data.get('label', source_fk)
            self.sources[source_fk] = Source.create({
                'foreign_id': source_fk,
                'label': label
            })
            if source_data.get('public'):
                Permission.grant_foreign(self.sources[source_fk],
                                         Role.SYSTEM_GUEST,
                                         True, False)
            db.session.commit()

        log.info('Import: %r', item.identifier)
        meta = self.normalize_metadata(item)
        ingest_file(self.sources[source_fk].id, meta,
                    item.data_path, move=False)

    def crawl(self, folder, source=None):
        mf = metafolder.open(folder)
        self.sources = {}
        for item in mf:
            self.crawl_item(item, source)
