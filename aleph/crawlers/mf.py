import logging
import metafolder

from aleph import process
from aleph.model import Permission, Role
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


class MetaFolderCrawler(Crawler):

    name = 'metafolder'

    def normalize_metadata(self, item):
        meta = self.metadata()
        meta.data.update(item.meta)
        if not item.meta.get('foreign_id'):
            meta['foreign_id'] = item.identifier
        meta.dates = item.meta.get('dates', [])
        meta.countries = item.meta.get('countries', [])
        meta.languages = item.meta.get('languages', [])
        meta.keywords = item.meta.get('keywords', [])
        return meta

    def crawl_item(self, item, sources, source):
        source_data = item.meta.get('source', {})
        source_id = source_data.pop('foreign_id', source)
        if source_id is None:
            raise ValueError("No foreign_id for source given: %r" % item)
        if source_id not in sources:
            label = source_data.get('label', source_id)
            sources[source_id] = self.create_source(foreign_id=source_id,
                                                    label=label)
            if source_data.get('public'):
                Permission.grant_foreign(sources[source_id],
                                         Role.SYSTEM_GUEST,
                                         True, False)
            if source_data.get('users'):
                Permission.grant_foreign(sources[source_id],
                                         Role.SYSTEM_USER,
                                         True, False)

        log.info('Import: %r', item.identifier)
        meta = self.normalize_metadata(item)
        self.emit_file(sources[source_id], meta, item.data_path)

    def crawl(self, folder, source=None):
        mf = metafolder.open(folder)
        sources = {}
        for item in mf:
            try:
                self.crawl_item(item, sources, source)
            except Exception as ex:
                process.exception(process.INDEX, component=self.name,
                                  foreign_id=item.identifier,
                                  source_location=folder, meta=item.meta,
                                  exception=ex)
