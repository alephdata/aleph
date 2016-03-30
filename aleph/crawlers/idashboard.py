import os
import logging
from tempfile import mkstemp
from urlparse import urljoin
import requests

from aleph.core import get_config, db
from aleph.model import Collection, Permission, Entity
from aleph.model.constants import PERSON, COMPANY
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)

REQUEST_TYPES = {
    "person_ownership": PERSON,
    "company_ownership": COMPANY
}


class IDBase(Crawler):

    @property
    def host(self):
        return get_config('ID_HOST', 'https://investigativedashboard.org/')

    @property
    def session(self):
        if not hasattr(self, '_session'):
            username = get_config('ID_USERNAME')
            password = get_config('ID_PASSWORD')
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


class IDFiles(IDBase):

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
            meta.foreign_id = data['id']
            meta.file_name = data['filename']
            meta.title = data['title']
            meta.mime_type = data['mimetype']
            meta.add_date(data['date_added'])
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


class IDRequests(IDBase):

    def crawl(self):
        url = urljoin(self.host, '/ticket/all_closed/?format=json')
        collection = Collection.by_foreign_id(url, {
            'label': 'Investigative Dashboard Requests'
        })
        Permission.grant_foreign(collection, 'idashboard:occrp_staff',
                                 True, False)
        existing_entities = []
        terms = set()
        db.session.flush()
        for endpoint in ['all_closed', 'all_open']:
            url = urljoin(self.host, '/ticket/%s/?format=json' % endpoint)
            data = self.session.get(url).json()
            for req in data.get('paginator', {}).get('object_list'):
                category = REQUEST_TYPES.get(req.get('ticket_type'))
                if category is None:
                    continue
                ent = Entity.by_foreign_id(str(req.get('id')), collection, {
                    'name': req.get('name'),
                    'category': category,
                    'data': req,
                    'selectors': [req.get('name')]
                })
                terms.update(ent.terms)
                existing_entities.append(ent.id)
                log.info("  # %s (%s)", ent.name, ent.category)

        for entity in collection.entities:
            if entity.id not in existing_entities:
                entity.delete()
        self.emit_collection(collection, terms)
