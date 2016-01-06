import logging
from tempfile import NamedTemporaryFile

from aleph.core import db
from aleph.model import Metadata, Source
from aleph.ext import get_crawlers
from aleph.ingest import ingest_url, ingest_file

log = logging.getLogger(__name__)


class Crawler(object):

    def crawl(self, **kwargs):
        raise NotImplemented()

    def create_source(self, **data):
        if 'foreign_id' not in data:
            for name, cls in get_crawlers().items():
                if isinstance(self, cls):
                    data['foreign_id'] = name
        return Source.create(data)

    def metadata(self):
        return Metadata(data={
            'crawler': self.__class__.__name__
        })

    def emit_url(self, source, meta, url):
        db.session.commit()
        ingest_url.delay(source.id, meta.data, url)

    def emit_content(self, source, meta, content):
        db.session.commit()
        with NamedTemporaryFile() as fh:
            fh.write(content)
            ingest_file(source.id, meta, fh.name)

    def emit_file(self, source, meta, file_path):
        db.session.commit()
        ingest_file(source.id, meta, file_path)

    def __repr__(self):
        return '<%s()>' % self.__class__.__name__
