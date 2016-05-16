from aleph.crawlers.crawler import Crawler
import requests
import logging

log = logging.getLogger(__name__)

SOURCE_AFRICA_URL = "http://dc.sourceafrica.net/api/search.json"
RESULTS_PER_PAGE = 100

class SourceAfricaCrawler(Crawler):
    '''
    '''

    def get_pages(self):
        '''
        retrieve number of pages in source
        '''
        resp = requests.get(
                SOURCE_AFRICA_URL,
                params=dict(q='', per_page=RESULTS_PER_PAGE),
                timeout=4)
        documentcount = resp.json()['total']
        pages = documentcount / RESULTS_PER_PAGE
        return pages

    
    def get_documents(self, page):
        '''
        retrieve docs from sourceAfrica API
        '''
        resp = requests.get(SOURCE_AFRICA_URL,
                            params=dict(q='', per_page=RESULTS_PER_PAGE, page=page),
                            timeout=4)
        try:
            resp.raise_for_status()
            return resp.json()['documents']
        except:
            err = "sourceAfrica search fail: %s - %s" % (resp.status_code, resp.text)
            log.error(err)
            return []
        


    def crawl(self):
        source = self.create_source(foreign_id='sourceafrica', label='sourceafrica.net documents')
        pagecount = self.get_pages()
        log.info("==== Starting to crawl: %s pages in %s" % (pagecount, SOURCE_AFRICA_URL))
        for page in range(1, pagecount):
            log.info("Fetching page %s of %s" % (page, pagecount))
            documents = self.get_documents(page)

            for idx in range(0, len(documents)):

                doc = documents[idx]
                print "Pg %s:: document %s of %s: %s | %s | {file_hash}".format(**doc) % (
                        page, idx, len(documents), doc['id'].encode('utf-8'), doc['title'].encode('utf-8'))
                meta = self.metadata()
                meta.foreign_id = "sourceafrica.%s" % doc['id']
                meta.title = "%s" % doc['title']
                meta.mime_type = "application/pdf"
                meta.hash = doc['file_hash']
                self.emit_url(source, meta, doc['resources']['pdf'])
