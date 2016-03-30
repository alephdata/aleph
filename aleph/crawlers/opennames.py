from urlparse import urljoin
import requests
import logging

from aleph.core import db
from aleph.model import Collection, Entity, Role, Permission
from aleph.model.constants import PERSON, ORGANIZATION, OTHER
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)

JSON_PATH = 'http://archive.pudo.org/opennames/latest/metadata.json'
IGNORE_SOURCES = ['EVERY-POLITICIAN']
CATEGORIES = {
    'individual': PERSON,
    'entity': ORGANIZATION
}


class OpenNamesCrawler(Crawler):

    def crawl_source(self, source):
        if source.get('source_id') in IGNORE_SOURCES:
            return

        json_file = source.get('data', {}).get('json')
        url = urljoin(JSON_PATH, json_file)
        source_name = source.get('source') or source.get('source_id')
        label = '%s - %s' % (source.get('publisher'), source_name)
        collection = Collection.by_foreign_id(url, {
            'label': label
        })
        Permission.grant_foreign(collection, Role.SYSTEM_GUEST, True, False)
        log.info(" > OpenNames collection: %s", collection.label)
        terms = set()
        existing_entities = []
        db.session.flush()
        entities = requests.get(url).json().get('entities', [])
        for entity in entities:
            if entity.get('name') is None:
                continue
            selectors = []
            for on in entity.get('other_names', []):
                selectors.append(on.get('other_name'))

            for iden in entity.get('identities', []):
                if iden.get('number'):
                    selectors.append(iden.get('number'))

            ent = Entity.by_foreign_id(entity.get('uid'), collection, {
                'name': entity.get('name'),
                'category': CATEGORIES.get(entity.get('type'), OTHER),
                'data': entity,
                'selectors': selectors
            })
            terms.update(ent.terms)
            existing_entities.append(ent.id)
            log.info("  # %s (%s)", ent.name, ent.category)

        for entity in collection.entities:
            if entity.id not in existing_entities:
                entity.delete()
        self.emit_collection(collection, terms)

    def crawl(self):
        data = requests.get(JSON_PATH).json()
        for source in data.get('sources', []):
            self.crawl_source(source)
