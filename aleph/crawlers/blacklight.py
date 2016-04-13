from aleph.crawlers.crawler import Crawler
#from aleph.sources.blacklight_sources import SITES
import time
import requests
import logging
log = logging.getLogger(__name__)
FAILED_LIMIT =  1000

#SITES example
SITES = {
	'http://demo.projectblacklight.org/': {
		'label': 'Demo Blacklight',
		'meta':[
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


class BlacklightCrawler(Crawler):

    def crawl_document(self, base_url, id):
        source_url = base_url + 'catalog/'+ id + '.json'
        response = requests.get(source_url)
        try:
            response.raise_for_status()
        except:
            log.warning('Failed to load: %r', source_url)
            return True

        response = response.json()
        doc = response['response']['document']
        meta = self.metadata()
        meta['source_url'] = source_url
        #Loop through each attribute and append to metadata
        for attr in self.attributes['meta']:
            try:
                meta[attr] = doc[attr]
            except Exception,e:
                log.warning('Missing attribute:%s from %r', attr, source_url) #Probable key error

        content = doc[self.attributes['content']]
        log.info('Scraped doc {}'.format(id))
        self.emit_content(self.source, meta, content)
        return True

    def crawl_page(self, base_url, page_number):
        page_url = base_url + 'catalog.json?page='+ str(page_number)
        log.info('crawling url: {}'.format(page_url))
        response = requests.get(page_url)
        try:
            response.raise_for_status()
        except:
            log.warning('Failed to load: %r', page_url)
            return True

        response = response.json()
        for i in response['response']['docs']:
            response = self.crawl_document(base_url, i['id'])
            if not response:
                 self.failed_articles += 1

    def get_page_count(self, base_url):
        page_url = base_url + 'catalog.json'
        response = requests.get(page_url)
        try:
            response.raise_for_status()
        except:
            log.warning('Failed to load: %r', page_url)
            return 0

        response = response.json()
        return response['response']['pages']['total_count']

    def crawl(self):
        for base_url in SITES:
            print 'Working on base_url: {}'.format(base_url)
            self.attributes = SITES[base_url]
            self.label= self.attributes['label']
            self.source = self.create_source(label = self.label)
            self.failed_articles = 0
            page_count = self.get_page_count(base_url)
            print "Pages: {}".format(page_count)
            page_number = 1
            while (page_number <= page_count):
                if self.failed_articles >= FAILED_LIMIT:
                    log.warning('Failure limit reach: {}'.format(FAILED_LIMIT))
                    break

                self.crawl_page(base_url, page_number)
                page_number += 1
