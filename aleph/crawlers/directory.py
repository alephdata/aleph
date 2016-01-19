import os
from normality import slugify
from extractors import guess_encoding

from aleph.model import Source
from aleph.crawlers.crawler import Crawler

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
            for file_name in files:
                if file_name in SKIP_FILES:
                    continue
                file_path = os.path.join(dirname, file_name)
                if not os.path.isfile(file_path):
                    continue
                enc = guess_encoding(file_path)
                if enc is not None:
                    try:
                        file_path = file_path.decode(enc)
                    except:
                        pass
                meta = self.metadata()
                meta.file_name = os.path.basename(file_path)
                meta.source_path = file_path
                self.emit_file(source, meta, file_path)
