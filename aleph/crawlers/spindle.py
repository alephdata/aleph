from urlparse import urljoin
from pprint import pprint  # noqa
import requests
import logging

from aleph.core import get_config
from aleph.model import Collection, Entity, Permission
from aleph.model.constants import PERSON, ORGANIZATION, COMPANY, OTHER
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)

SCHEMATA = {
    'https://schema.occrp.org/generic/person.json#': PERSON,
    'https://schema.occrp.org/generic/company.json#': COMPANY,
    'https://schema.occrp.org/generic/organization.json#': ORGANIZATION
}


class SpindleCrawler(Crawler):

    URL = get_config('SPINDLE_URL')
    API_KEY = get_config('SPINDLE_API_KEY')
    HEADERS = {'Authorization': 'ApiKey %s' % API_KEY}

    def crawl_collection(self, collection):
        if not len(collection.get('subjects', [])):
            return
        url = urljoin(self.URL, '/api/collections/%s' % collection.get('id'))
        collection = Collection.by_foreign_id(url, {
            'label': collection.get('title')
        })
        res = requests.get('%s/permissions' % url, headers=self.HEADERS)
        for perm in res.json().get('results', []):
            Permission.grant_foreign(collection, perm.get('role'),
                                     perm.get('read'), perm.get('write'))

        log.info(" > Spindle collection: %s", collection.label)
        res = requests.get('%s/entities' % url, headers=self.HEADERS)
        terms = set()
        existing_entities = []
        for entity in res.json().get('results', []):
            if entity.get('name') is None:
                continue
            aliases = [on.get('alias') for on in entity.get('other_names', [])]
            ent = Entity.by_foreign_id(entity.get('id'), collection, {
                'name': entity.get('name'),
                'category': SCHEMATA.get(entity.get('$schema'), OTHER),
                'data': entity,
                'selectors': aliases
            })
            terms.update(ent.terms)
            existing_entities.append(ent.id)
            log.info("  # %s (%s)", ent.name, ent.category)

        for entity in collection.entities:
            if entity.id not in existing_entities:
                entity.delete()
        self.emit_collection(collection, terms)

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
