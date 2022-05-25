import json

from lxml.html import document_fromstring
from werkzeug.exceptions import BadRequest

from aleph.logic.html import sanitize_html
from aleph.views.util import get_url_path, validate
from aleph.tests.util import TestCase


class ViewUtilTest(TestCase):
    def setUp(self):
        super(ViewUtilTest, self).setUp()

    def test_get_url_pat(self):
        self.assertEqual("/", get_url_path(""))
        self.assertEqual("/next", get_url_path("/next"))
        self.assertEqual("/next", get_url_path("https://aleph.ui:3000/next"))
        url = get_url_path("https://example.com\\@aleph.ui/oauth?path=%%2F")
        self.assertEqual("/oauth?path=%%2F", url)
        self.assertEqual("/%%2F", get_url_path("https://example.com\\@aleph.ui/%%2F"))

    def test_sanitize_html(self):
        html_str = '<!doctype html><html><head><title>Article</title><style type="text/css">body { }</style><script>alert("We love Angular")</script><link rel="stylesheet" href="http://xss.rocks/xss.css"></head><body><article id="story"><h1>We welcome our new React overlords</h1><img src="&#14;  javascript:alert(\'XSS\');" alt="" /><p>Published on <time onmouseover="alert(\'XSS\')">1 January 2018</time></p><p>Really the only thing better than the <a href="/blockchain">blockchain</a> is ReactJS.</p></article><video> <source onerror = "javascript: alert (XSS)"></video></body></html>'  # noqa
        processed = sanitize_html(html_str, "https://example.org/welcome-react")
        html = document_fromstring(processed)
        assert html.find(".//img") is None, html
        assert html.find(".//video") is None, html
        assert html.find(".//style") is None, html
        assert html.find(".//script") is None, html
        assert len(html.findall(".//article")) == 1, html
        attr = html.find(".//time").get("onmouseover")
        assert attr is None, html
        attr = html.find(".//a").get("href")
        assert attr == "https://example.org/blockchain", html
        assert html.find(".//a").get("target") == "_blank", html
        assert "nofollow" in html.find(".//a").get("rel"), html

    def test_validate_returns_errors_for_paths(self):
        # given
        schema = "RoleCreate" # name min length 4, password min length 6
        data = json.loads('{"name":"Bob","password":"1234","code":"token"}')

        # then
        with self.assertRaises(BadRequest) as ctx:
            validate(data, schema)

        self.assertEqual(ctx.exception.response.get_json().get("errors"), {"name": "'Bob' is too short", "password": "'1234' is too short"})

    def test_validate_concatenates_multiple_errors_for_the_same_path(self):
        # given
        schema = "RoleCreate" # requires password and code 
        data = json.loads('{"wrong":"No password, no code"}')

        # then
        with self.assertRaises(BadRequest) as ctx:
            validate(data, schema)

        self.assertEqual(ctx.exception.response.get_json().get("errors"), {"": "'password' is a required property; 'code' is a required property"})
