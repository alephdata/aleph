import json
from aleph.validation import validate, ValidationException
from aleph.tests.util import TestCase


class SchemaValidationTest(TestCase):
    def test_role_schema(self):
        data = {
            "name": "sunu",
            "is_muted": True,
            "password": "very-secret-password",
            "current_password": "secret-password",
            "locale": "en-us",
        }
        with self.assertRaises(ValidationException):
            validate(data, "RoleUpdate")

    def test_validate_returns_errors_for_paths(self):
        # given
        schema = "RoleCreate"  # name min length 4, password min length 6
        data = json.loads('{"name":"Bob","password":"1234","code":"token"}')

        # then
        with self.assertRaises(ValidationException) as ctx:
            validate(data, schema)

        self.assertEqual(
            ctx.exception.errors,
            {"name": "'Bob' is too short", "password": "'1234' is too short"},
        )

    def test_validate_concatenates_multiple_errors_for_the_same_path(self):
        # given
        schema = "RoleCreate"  # requires password and code
        data = json.loads('{"wrong":"No password, no code"}')

        # then
        with self.assertRaises(ValidationException) as ctx:
            validate(data, schema)

        self.assertEqual(
            ctx.exception.errors,
            {"": "'password' is a required property; 'code' is a required property"},
        )
