from flask import Request

from aleph.views.util import extract_next_url
from aleph.tests.util import TestCase


class ViewUtilTest(TestCase):

    def setUp(self):
        super(ViewUtilTest, self).setUp()

    def test_extract_next_url_blank(self):
        req = Request.from_values('')

        self.assertEqual('/', extract_next_url(req))

    def test_extract_next_url_unsafe(self):
        req = Request.from_values('/?next={}'.format(self.fake.url()))

        self.assertEqual('/', extract_next_url(req))

    def test_extract_next_url_safe(self):
        req = Request.from_values('/?next=/help')

        self.assertEqual('/help', extract_next_url(req))
