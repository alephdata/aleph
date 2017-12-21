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
        html = '<!doctype html><html><head><title>Article</title><style type="text/css">body { }</style><script>alert("We love Angular")</script><link rel="stylesheet" href="http://xss.rocks/xss.css"></head><body><article id="story"><h1>We welcome our new React overlords</h1><img src="&#14;  javascript:alert(\'XSS\');" alt="" /><p>Published on <time onmouseover="alert(\'XSS\')">1 January 2018</time></p><p>Really the only thing better than the <a href="/blockchain">blockchain</a> is ReactJS.</p></article><video> <source onerror = "javascript: alert (XSS)"></video></body></html>'
        cleaned = '<div><article id="story"><h1>We welcome our new React overlords</h1><p>Published on <time>1 January 2018</time></p><p>Really the only thing better than the <a href="https://example.org/blockchain" rel="nofollow">blockchain</a> is ReactJS.</p></article></div>'
        processed = sanitize_html(html, 'https://example.org/welcome-react')
        self.assertEqual(processed, cleaned)
