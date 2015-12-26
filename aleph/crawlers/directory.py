import os
from normality import slugify

from aleph.model import Source
from aleph.crawlers.crawler import Crawler

SKIP_FILES = ['.DS_Store', '.gitignore', 'Thumbs.db']


class DirectoryCrawler(Crawler):

    def crawl(self, directory=None, source=None):
        source = source or directory
        source = Source.create({
            'key': 'directory:%s' % slugify(source),
            'label': source
        })
        directory = directory or os.getcwd()
        for (dirname, dirs, files) in os.walk(directory):
            for file_name in files:
                if file_name in SKIP_FILES:
                    continue
                meta = self.metadata()
                meta.title = file_name
                meta.file_name = file_name
                self.emit_file(source, meta, os.path.join(dirname, file_name))
