import os
import shutil
import logging
from tempfile import mkstemp
from urlparse import urljoin
import requests

from aleph.core import app
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


class InvestigativeDashboard(Crawler):

    @property
    def host(self):
        return app.config.get('ID_HOST', 'https://investigativedashboard.org/')

    @property
    def session(self):
        if not hasattr(self, '_session'):
            username = app.config.get('ID_USERNAME')
            password = app.config.get('ID_PASSWORD')
            sess = requests.Session()
            res = sess.get(urljoin(self.host, '/accounts/login/'))
            data = {'csrfmiddlewaretoken': sess.cookies['csrftoken'],
                    'username': username,
                    'password': password}
            res = sess.post(res.url, data=data, headers={
                'Referer': res.url
            })
            self._session = sess
        return self._session

    def crawl_file(self, data):
        if data['public_read']:
            source = self.create_source(foreign_id='idashboard:public',
                                        label='Investigative Dashboard (Public)')
        elif data['staff_read']:
            source = self.create_source(foreign_id='idashboard:staff',
                                        label='Investigative Dashboard (Staff)')
        else:
            return

        fh, file_path = mkstemp(suffix=data['filename'])
        try:
            meta = self.metadata()
            meta.file_name = data['filename']
            meta.title = data['title']
            meta.mime_type = data['mimetype']
            if len(data.get('description', '')):
                meta.summary = data['description']
            url = urljoin(self.host, '/podaci/file/%s/download' % data['id'])
            res = self.session.get(url, stream=True)
            fh = os.fdopen(fh, 'w')
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)
            fh.close()
            log.info("Importing %r to %r", meta.title, source)
            self.emit_file(source, meta, file_path, move=True)
        except Exception as ex:
            log.exception(ex)
        finally:
            if os.path.isfile(file_path):
                os.unlink(file_path)

    def crawl(self):
        url = urljoin(self.host, '/podaci/search/?q=+&format=json')
        while True:
            res = self.session.get(url)
            data = res.json()
            for filedata in data.get('results', []):
                self.crawl_file(filedata)
            if not data.get('next'):
                break
            url = data['next']
