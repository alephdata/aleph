from urlparse import urljoin
import requests
import logging

from aleph.core import db
from aleph.model import Watchlist, Entity
from aleph.analyze import analyze_terms
from aleph.model.forms import PERSON, ORGANIZATION, OTHER
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

        watchlist = Watchlist.by_foreign_id(url, {
            'label': source.get('source_id'),
            'public': True,
            'users': []
        })
        log.info(" > Spindle collection: %s", watchlist.label)
        watchlist.delete_entities()
        db.session.flush()
        terms = watchlist.terms
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
            ent = Entity.create({
                'name': entity.get('name'),
                'watchlist': watchlist,
                'category': CATEGORIES.get(entity.get('type'), OTHER),
                'data': entity,
                'selectors': selectors
            })
            log.info("  # %s (%s)", ent.name, ent.category)
        terms.update(watchlist.terms)
        db.session.commit()
        analyze_terms.delay(list(terms))

    def crawl(self):
        data = requests.get(JSON_PATH).json()
        for source in data.get('sources', []):
            self.crawl_source(source)
