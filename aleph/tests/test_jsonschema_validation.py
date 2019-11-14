from werkzeug.exceptions import BadRequest

from aleph.views.forms import RoleSchema
from aleph.tests.util import TestCase
from aleph.views.util import validate_data


class SchemaValidationTest(TestCase):

    def setUp(self):
        super(SchemaValidationTest, self).setUp()

    def test_role_schema(self):
        data = {
            "name": "sunu",
            "is_muted": True,
            "password": "very-secret-password",
            "current_password": "secret-password",
            "locale": "en-us",
        }
        with self.assertRaises(BadRequest):
            validate_data(data, RoleSchema)
