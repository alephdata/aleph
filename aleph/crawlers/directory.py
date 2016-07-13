import os
import logging
from normality import slugify

from aleph.core import db
from aleph.text import string_value
from aleph.model import Collection
from aleph.ingest import ingest_directory
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


class DirectoryCrawler(Crawler):

    def crawl(self, directory=None, collection=None, meta={}):
        directory = string_value(directory)
        if directory is None or not os.path.exists(directory):
            log.error("Invalid directory: %r", directory)
            return
        directory = os.path.abspath(os.path.normpath(directory))
        collection = collection or directory
        collection = Collection.create({
            'foreign_id': 'directory:%s' % slugify(collection),
            'label': collection
        })
        db.session.commit()
        meta = self.make_meta(meta)
        ingest_directory(collection.id, meta, directory)
