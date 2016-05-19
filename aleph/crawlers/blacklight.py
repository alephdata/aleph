import requests
import logging
import json

from aleph.core import db
from aleph.model import Source
from aleph.crawlers.crawler import DocumentCrawler

log = logging.getLogger(__name__)

FAILED_LIMIT = 1000

# SITES example
SITES = {
    # 'http://demo.projectblacklight.org/': {
    # 'http://195.221.120.231/': {
    'http://iucat.iu.edu/': {
        'label': 'Demo Blacklight',
        'meta': [
            'title_display',
            'author_t',
            'timestamp',
            'id',
            'author_display',
            'format',
            'isbn_t',
            'published_display',
            'lc_callnum_display',
            'subject_geo_facet',
            'pub_date',
            'language_facet',
            'material_type_display',
            'score'
        ],
        'content': 'marc_display'
    }
}


class BlacklightCrawler(DocumentCrawler):

    def crawl_document(self, base_url, id):
        source_url = base_url + 'catalog/'+ id + '.json'
        response = requests.get(source_url, timeout=4)
        try:
            response.raise_for_status()
        except:
            log.warning(' Failed to load: %s -- %s: %s', source_url,
                        response.status_code, response.text)
            return True

        response = response.json()
        meta = self.make_meta()
        meta['source_url'] = source_url

        if 'document' in response['response']:
            doc = response['response']['document']
            # Loop through each attribute and append to metadata
            for attr in self.attributes['meta']:
                try:
                    meta[attr] = doc[attr]
                except Exception as e:
                    pass
                    # log.warning('Missing attribute:%s from %r', attr, source_url) #Probable key error

            content = doc[self.attributes['content']]
            log.info('Scraped doc {}'.format(id))
            self.emit_content(self.source, meta, content)
            return True
        else:
            docs = len(response['response']['docs'])
            for idx in range(1, docs):
                print "{} nested docs to scrape".format(docs-idx)
                doc = response['response']['docs'][idx]
                for attr in self.attributes['meta']:
                    try:
                        meta[attr] = doc[attr]
                    except Exception, e:
                        pass
                        # log.warning('Missing attribute:%s from %r', attr, source_url) #Probable key error
                log.info("Scraped doc {}".format(doc['id']))
                self.emit_content(self.source, meta, json.dumps(doc))
            return True

    def crawl_page(self, base_url, page_number, page_count):
        page_url = base_url + 'catalog.json?page=' + str(page_number)
        log.info('crawling page {} url: {}'.format(page_number, page_url))
        response = requests.get(page_url, timeout=4)
        try:
            response.raise_for_status()
        except:
            log.warning('Failed to load: %s -- %s: %s', page_url,
                        response.status_code, response.text)
            return True

        response = response.json()
        alldocs = len(response['response']['docs'])
        counter = 1
        for i in response['response']['docs']:
            log.info("crawling document {} of {} on page {} of {}".format(
                counter, alldocs, page_number, page_count))
            response = self.crawl_document(base_url, i['id'])
            if not response:
                self.failed_articles += 1
            counter += 1

    def get_page_count(self, base_url):
        page_url = base_url + 'catalog.json'
        response = requests.get(page_url, timeout=4)
        try:
            response.raise_for_status()
        except:
            log.warning('Failed to load: %s -- %s: %s', page_url,
                        response.status_code, response.text)
            return 0

        response = response.json()
        return response['response']['pages']['total_count']

    def crawl(self):
        for base_url in SITES:
            print 'Working on base_url: {}'.format(base_url)
            self.attributes = SITES[base_url]
            self.label = self.attributes['label']
            Source.create({
                'label': self.label,
                'foreign_id': 'blacklight'
            })
            db.session.commit()
            self.failed_articles = 0
            page_count = self.get_page_count(base_url)
            print "Pages: {}".format(page_count)
            page_number = 1
            while (page_number <= page_count):
                if self.failed_articles >= FAILED_LIMIT:
                    log.warning('Failure limit reach: {}'.format(FAILED_LIMIT))
                    break

                self.crawl_page(base_url, page_number, page_count)
                page_number += 1
