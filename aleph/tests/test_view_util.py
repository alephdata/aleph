import json

from werkzeug.exceptions import BadRequest

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

    def test_validate_returns_errors_for_paths(self):
        # given
        schema = "RoleCreate"  # name min length 4, password min length 6
        data = json.loads('{"name":"Bob","password":"1234","code":"token"}')

        # then
        with self.assertRaises(BadRequest) as ctx:
            validate(data, schema)

        self.assertEqual(
            ctx.exception.response.get_json().get("errors"),
            {"name": "'Bob' is too short", "password": "'1234' is too short"},
        )

    def test_validate_concatenates_multiple_errors_for_the_same_path(self):
        # given
        schema = "RoleCreate"  # requires password and code
        data = json.loads('{"wrong":"No password, no code"}')

        # then
        with self.assertRaises(BadRequest) as ctx:
            validate(data, schema)

        self.assertEqual(
            ctx.exception.response.get_json().get("errors"),
            {"": "'password' is a required property; 'code' is a required property"},
        )
