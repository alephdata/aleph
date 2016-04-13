from aleph.tests.util import TestCase
from aleph.crawlers.crawler import Crawler
from aleph.crawlers import blacklight

class CrawlersTestCase(TestCase):

    def setUp(self):
        super(CrawlersTestCase, self).setUp()
        self.demo_url = "http://demo.projectblacklight.org/"
        self.bl = blacklight.BlacklightCrawler(Crawler)
        

    def test_blacklight_crawldocument(self,):
        resp = self.bl.crawl_document(self.demo_url, '1')
        self.assertIsInstance(resp, bool)
        self.assertEqual(resp, True)

    def test_blacklight_get_page_count(self,):
        resp = self.bl.get_page_count(self.demo_url)
        self.assertTrue(str(resp).isdigit())
