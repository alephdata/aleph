import os

from aleph.model import Document, Collection
from aleph.tests.util import TestCase
from aleph.crawlers import DocumentCrawler


class TDocumentCrawler(DocumentCrawler):
    COLLECTION_ID = 'test'

    def crawl(self):
        doc = self.create_document(foreign_id=self.test_path)
        doc.title = 'hello, kitty'
        if self.skip_incremental(self.test_path):
            return
        self.emit_file(doc, self.test_path)


class CrawlerTestCase(TestCase):

    def setUp(self):
        super(CrawlerTestCase, self).setUp()
        TDocumentCrawler.test_path = self.get_fixture_path('demo.pdf')

    def test_crawler_basic(self):
        assert TDocumentCrawler.COLLECTION_ID in TDocumentCrawler().get_id()

    def test_crawler_execute(self):
        tdc = TDocumentCrawler()
        ccnt = Document.all().count()
        assert ccnt == 0, ccnt
        tdc.execute()
        states = Document.all().all()
        assert len(states) == 1, len(states)
        demo = states[0]
        assert 'kitty' in demo.title, demo.meta

        coll = Collection.by_foreign_id('test')
        assert coll is not None, coll
        assert len(list(coll.documents)) == 1, list(coll.documents)

    def test_incremental(self):
        tdc = TDocumentCrawler()
        tdc.execute()
        tdc.execute(incremental=True)
        states = Document.all().all()
        assert len(states) == 1, len(states)

    def test_crawler_save_data(self):
        tdc = TDocumentCrawler()
        text = 'banana fruit shop'
        file_path = tdc.save_data(text)
        out_text = open(file_path, 'r').read()
        os.unlink(file_path)
        assert out_text == text, (out_text, text)

        file_path = tdc.save_data(None)
        out_text = open(file_path, 'r').read()
        assert out_text == '', out_text
