import logging
from urlparse import urljoin
import requests

from aleph.core import get_config
from aleph.model import Permission
from aleph.crawlers.crawler import DocumentCrawler, EntityCrawler

log = logging.getLogger(__name__)

REQUEST_TYPES = {
    "person_ownership": '/entity/person.json#',
    "company_ownership": '/entity/company.json#'
}


class IDBase(object):  # pragma: no cover

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


class IDFiles(IDBase, DocumentCrawler):  # pragma: no cover
    SOURCE_ID = 'idashboard:staff'
    SOURCE_LABEL = 'Investigative Dashboard Requests'
    SCHEDULE = DocumentCrawler.DAILY

    def crawl_file(self, data):
        if self.skip_incremental(data['id']):
            return

        meta = self.make_meta({})
        meta.foreign_id = data['id']
        meta.file_name = data['filename']
        meta.title = data['title']
        meta.mime_type = data['mimetype']
        meta.add_date(data['date_added'])
        if len(data.get('description', '')):
            meta.summary = data['description']
        url = urljoin(self.host, '/podaci/file/%s/download' % data['id'])
        res = self.session.get(url, stream=True)
        file_path = self.save_response(res)
        log.info("Importing %r", meta.title)
        self.emit_file(meta, file_path, move=True)

    def crawl(self):
        url = urljoin(self.host, '/podaci/search/?q=+&format=json')
        while True:
            res = self.session.get(url)
            data = res.json()
            for filedata in data.get('results', []):
                try:
                    self.crawl_file(filedata)
                except Exception as ex:
                    log.exception(ex)
            if not data.get('next'):
                break
            url = data['next']


class IDRequests(IDBase, EntityCrawler):  # pragma: no cover

    def update_entity(self, entity, collection):
        category = REQUEST_TYPES.get(entity.get('ticket_type'))
        if category is None:
            return

        data = {
            'identifiers': [
                {
                    'schema': 'idashboard',
                    'identifier': entity.get('id')
                }
            ],
            'other_names': [],
            'name': entity.get('name'),
            '$schema': category
        }
        self.emit_entity(collection, data)

    def crawl(self):
        url = urljoin(self.host, '/ticket/all_closed/?format=json')
        coll = self.find_collection(url, {
            'label': 'Investigative Dashboard Requests'
        })
        Permission.grant_foreign(coll, 'idashboard:occrp_staff',
                                 True, False)
        for endpoint in ['all_closed', 'all_open']:
            url = urljoin(self.host, '/ticket/%s/?format=json' % endpoint)
            data = self.session.get(url).json()

            for req in data.get('paginator', {}).get('object_list'):
                # TODO: get the ID API fixed.
                self.update_entity(req, coll)

        self.emit_collection(coll)
