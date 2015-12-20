import os

from aleph.crawlers.crawler import Crawler

SKIP_FILES = ['.DS_Store', '.gitignore', 'Thumbs.db']


class DirectoryCrawler(Crawler):

    def crawl(self, directory=None):
        directory = directory or os.getcwd()
        for (dirname, dirs, files) in os.walk(directory):
            for file_name in files:
                if file_name in SKIP_FILES:
                    continue
                meta = self.metadata()
                meta.title = file_name
                meta.file_name = file_name
                self.emit_file(meta, os.path.join(dirname, file_name))
