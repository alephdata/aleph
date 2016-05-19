import os
import six
import chardet
import logging
from normality import slugify

from aleph.core import db
from aleph.model import Source
from aleph.ingest import ingest_file
from aleph.crawlers.crawler import Crawler

SKIP_DIRECTORIES = ['.git', '.hg']
SKIP_FILES = ['.DS_Store', '.gitignore', 'Thumbs.db']

log = logging.getLogger(__name__)


class DirectoryCrawler(Crawler):

    def crawl_file(self, source, file_path, base_meta):
        try:
            meta = self.make_meta(base_meta)
            meta.foreign_id = file_path
            if isinstance(file_path, six.text_type):
                meta.source_path = file_path
            else:
                enc = chardet.detect(file_path)
                enc = enc.get('encoding')
                try:
                    meta.source_path = file_path.decode(enc)
                except:
                    meta.source_path = file_path.decode('ascii', 'ignore')

            ingest_file(source.id, meta, file_path, move=False)
        except Exception as ex:
            log.exception(ex)

    def crawl(self, directory=None, source=None, meta={}):
        source = source or directory
        source = Source.create({
            'foreign_id': 'directory:%s' % slugify(source),
            'label': source
        })
        db.session.commit()

        if os.path.isfile(directory):
            self.crawl_file(source, directory, meta)

        directory = directory or os.getcwd()
        directory = directory.encode('utf-8')
        for (dirname, dirs, files) in os.walk(directory):
            dirparts = [d for d in dirname.split(os.path.sep)
                        if d in SKIP_DIRECTORIES]
            if len(dirparts):
                continue
            log.info("Descending: %r", dirname)
            for file_name in files:
                if file_name in SKIP_FILES:
                    continue
                file_path = os.path.join(dirname, file_name)
                if not os.path.isfile(file_path):
                    continue
                self.crawl_file(source, file_path, meta)
