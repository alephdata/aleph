import os
import logging

from aleph.core import db
from aleph.text import string_value, slugify
from aleph.ingest import ingest_directory
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


class DirectoryCrawler(Crawler):

    def crawl(self, directory=None, foreign_id=None, meta={}):
        directory = string_value(directory)
        if directory is None or not os.path.exists(directory):
            log.error("Invalid directory: %r", directory)
            return
        directory = os.path.abspath(os.path.normpath(directory))
        collection = None
        if foreign_id is None:
            foreign_id = 'directory:%s' % slugify(directory)
        collection = self.load_collection({
            'foreign_id': foreign_id,
            'label': directory,
            'managed': True
        })
        db.session.commit()
        meta = self.make_meta(meta)
        meta.source_path = directory
        ingest_directory(collection.id, meta, directory)
