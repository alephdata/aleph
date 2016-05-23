import os
import logging
from normality import slugify

from aleph.core import db
from aleph.model import Source
from aleph.text import string_value
from aleph.ingest import ingest_file
from aleph.crawlers.crawler import Crawler

SKIP_DIRECTORIES = ['.git', '.hg']
SKIP_FILES = ['.DS_Store', '.gitignore', 'Thumbs.db']

log = logging.getLogger(__name__)


class DirectoryCrawler(Crawler):

    def crawl_file(self, source_id, file_path, base_meta):
        try:
            if not os.path.isfile(file_path):
                log.info('Invalid file path: %r', file_path)
                return
            meta = self.make_meta(base_meta)
            file_path = string_value(file_path)
            meta.foreign_id = file_path
            meta.source_path = file_path
            meta.file_name = os.path.basename(file_path)
            ingest_file(source_id, meta, file_path, move=False)
        except Exception as ex:
            log.exception(ex)

    def crawl(self, directory=None, source=None, meta={}):
        source = source or directory
        source = Source.create({
            'foreign_id': 'directory:%s' % slugify(source),
            'label': source
        })
        db.session.commit()
        source_id = source.id

        if os.path.isfile(directory):
            self.crawl_file(source_id, directory, meta)

        directory = directory or os.getcwd()
        directory = directory.encode('utf-8')
        for (dirname, dirs, files) in os.walk(directory):
            dirparts = [d for d in dirname.split(os.path.sep)
                        if d in SKIP_DIRECTORIES]
            if len(dirparts):
                continue
            log.info("Descending: %r", dirname)
            for file_name in files:
                dirname = string_value(dirname)
                file_name = string_value(file_name)
                if file_name in SKIP_FILES:
                    continue
                file_path = os.path.join(dirname, file_name)
                self.crawl_file(source_id, file_path, meta)
