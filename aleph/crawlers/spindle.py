from urlparse import urljoin
from pprint import pprint  # noqa
import requests
import logging

from aleph.core import get_config
from aleph.model import Permission
from aleph.crawlers.crawler import EntityCrawler

log = logging.getLogger(__name__)

OTHER = '/entity/entity.json#'
SCHEMATA = {
    'https://schema.occrp.org/generic/person.json#': '/entity/person.json#',
    'https://schema.occrp.org/generic/company.json#': '/entity/company.json#',
    'https://schema.occrp.org/generic/organization.json#': '/entity/organization.json#'  # noqa
}


class SpindleCrawler(EntityCrawler):  # pragma: no cover

    URL = get_config('SPINDLE_URL')
    API_KEY = get_config('SPINDLE_API_KEY')
    HEADERS = {'Authorization': 'ApiKey %s' % API_KEY}

    def crawl_collection(self, collection):
        if not len(collection.get('subjects', [])):
            return
        url = urljoin(self.URL, '/api/collections/%s' % collection.get('id'))
        collection = self.find_collection(url, {
            'label': collection.get('title')
        })
        res = requests.get('%s/permissions' % url, headers=self.HEADERS)
        for perm in res.json().get('results', []):
            Permission.grant_foreign(collection, perm.get('role'),
                                     perm.get('read'), perm.get('write'))

        log.info(" > Spindle collection: %s", collection.label)
        res = requests.get('%s/entities' % url, headers=self.HEADERS)
        for entity in res.json().get('results', []):
            if entity.get('name') is None:
                continue
            entity['$schema'] = SCHEMATA.get(entity.get('$schema'), OTHER)
            if 'jurisdiction_code' in entity:
                entity['jurisdiction_code'] = \
                    entity['jurisdiction_code'].lower()
            entity.pop('members', None)
            entity.pop('memberships', None)
            entity.pop('assets', None)
            entity.pop('owners', None)
            entity.pop('family_first', None)
            entity.pop('family_second', None)
            entity.pop('social_first', None)
            entity.pop('social_second', None)

            for date_field in ['birth_date']:
                if date_field in entity and 'T' in entity[date_field]:
                    entity[date_field], _ = entity[date_field].split('T', 1)

            for on in entity.get('other_names', []):
                name = on.pop('alias', None)
                if name is not None:
                    on['name'] = name

            entity['identifiers'] = [{
                'scheme': 'spindle',
                'identifier': entity.pop('id', None)
            }]
            self.emit_entity(collection, entity)
        self.emit_collection(collection)

    def crawl(self):
        url = urljoin(self.URL, '/api/collections')
        while True:
            res = requests.get(url, headers=self.HEADERS)
            data = res.json()
            for coll in data.get('results', []):
                self.crawl_collection(coll)
            url = data.get('next_url')
            if url is None:
                break
            url = urljoin(self.URL, url)
