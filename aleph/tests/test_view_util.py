from lxml.html import document_fromstring

from aleph.views.util import get_best_next_url, sanitize_html
from aleph.tests.util import TestCase, UI_URL


class ViewUtilTest(TestCase):

    def setUp(self):
        super(ViewUtilTest, self).setUp()

    def test_get_best_next_url_blank(self):
        self.assertEqual(UI_URL, get_best_next_url(''))

    def test_get_best_next_url_unsafe(self):
        self.assertEqual(UI_URL, get_best_next_url(self.fake.url()))  # noqa

    def test_get_best_next_url_unsafe_safe(self):
        self.assertEqual(
            UI_URL + 'next', get_best_next_url(self.fake.url(), '/next'))

    def test_get_best_next_url_all_unsafe(self):
        self.assertEqual(UI_URL, get_best_next_url(self.fake.url(), self.fake.url()))  # noqa

    def test_sanitize_html(self):
        html_str = '<!doctype html><html><head><title>Article</title><style type="text/css">body { }</style><script>alert("We love Angular")</script><link rel="stylesheet" href="http://xss.rocks/xss.css"></head><body><article id="story"><h1>We welcome our new React overlords</h1><img src="&#14;  javascript:alert(\'XSS\');" alt="" /><p>Published on <time onmouseover="alert(\'XSS\')">1 January 2018</time></p><p>Really the only thing better than the <a href="/blockchain">blockchain</a> is ReactJS.</p></article><video> <source onerror = "javascript: alert (XSS)"></video></body></html>'  # noqa
        processed = sanitize_html(
            html_str, 'https://example.org/welcome-react')
        html = document_fromstring(processed)
        assert html.find('.//img') is None, html
        assert html.find('.//video') is None, html
        assert html.find('.//style') is None, html
        assert html.find('.//script') is None, html
        assert len(html.findall('.//article')) == 1, html
        attr = html.find('.//time').get('onmouseover')
        assert attr is None, html
        attr = html.find('.//a').get('href')
        assert attr == 'https://example.org/blockchain', html
        assert html.find('.//a').get('target') == '_blank', html
        assert 'nofollow' in html.find('.//a').get('rel'), html
