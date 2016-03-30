import os
import six
import chardet
import logging
from normality import slugify

from aleph import process
from aleph.model import Source
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)
SKIP_FILES = ['.DS_Store', '.gitignore', 'Thumbs.db']


class DirectoryCrawler(Crawler):

    def crawl(self, directory=None, source=None):
        source = source or directory
        source = Source.create({
            'foreign_id': 'directory:%s' % slugify(source),
            'label': source
        })

        if os.path.isfile(directory):
            meta = self.metadata()
            meta.file_name = directory
            self.emit_file(source, meta, directory)

        directory = directory or os.getcwd()
        directory = directory.encode('utf-8')
        for (dirname, dirs, files) in os.walk(directory):
            log.info("Descending: %r", dirname)
            for file_name in files:
                if file_name in SKIP_FILES:
                    continue
                file_path = os.path.join(dirname, file_name)
                if not os.path.isfile(file_path):
                    continue
                try:
                    meta = self.metadata()
                    if isinstance(file_name, six.text_type):
                        meta.source_path = file_path
                    else:
                        enc = chardet.detect(file_name)
                        enc = enc.get('encoding')
                        try:
                            meta.source_path = file_path.decode(enc)
                        except:
                            meta.source_path = file_path.decode('ascii', 'ignore')

                    self.emit_file(source, meta, file_path)
                except Exception as ex:
                    log.exception(ex)
                    process.exception(process.INDEX, component=self.name,
                                      source_location=directory,
                                      source_id=source.id, exception=ex)
