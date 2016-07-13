import os
import logging
from normality import slugify

from aleph.core import db
from aleph.text import string_value
from aleph.model import Collection
from aleph.ingest import ingest_directory
from aleph.crawlers.crawler import Crawler

SKIP_DIRECTORIES = ['.git', '.hg']
SKIP_FILES = ['.DS_Store', '.gitignore', 'Thumbs.db']

log = logging.getLogger(__name__)


class DirectoryCrawler(Crawler):

    def crawl(self, directory=None, collection=None, meta={}):
        if directory is None or not os.path.exists(directory):
            log.warning("Invalid directory: %r", directory)
            return
        directory = os.path.abspath(directory)
        directory = os.path.normpath(directory)
        directory = string_value(directory)
        collection = collection or directory
        collection = Collection.create({
            'foreign_id': 'directory:%s' % slugify(collection),
            'label': collection
        })
        db.session.commit()
        meta = self.make_meta(meta)
        ingest_directory(collection.id, meta, directory)
