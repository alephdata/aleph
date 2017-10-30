from flask import Request

from aleph.views.util import extract_next_url, get_best_next_url
from aleph.tests.util import TestCase


class ViewUtilTest(TestCase):

    def setUp(self):
        super(ViewUtilTest, self).setUp()

    def test_extract_next_url_blank(self):
        req = Request.from_values('')
        self.assertEqual('http://localhost:5000/', extract_next_url(req))

    def test_extract_next_url_unsafe(self):
        req = Request.from_values('/?next={}'.format(self.fake.url()))
        self.assertEqual('http://localhost:5000/', extract_next_url(req))

    def test_extract_next_url_safe(self):
        headers = {'Referer': '/blah'}
        req = Request.from_values('/?next=/help', headers=headers)
        self.assertEqual('/help', extract_next_url(req))

    def test_get_best_next_url_blank(self):
        self.assertEqual('http://localhost:5000/', get_best_next_url(''))

    def test_get_best_next_url_unsafe(self):
        self.assertEqual('http://localhost:5000/', get_best_next_url(self.fake.url()))

    def test_get_best_next_url_unsafe_safe(self):
        self.assertEqual('/next', get_best_next_url(self.fake.url(), '/next'))

    def test_get_best_next_url_all_unsafe(self):
        self.assertEqual('http://localhost:5000/',
            get_best_next_url(self.fake.url(), self.fake.url()))
