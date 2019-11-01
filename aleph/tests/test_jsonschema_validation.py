from werkzeug.exceptions import BadRequest

from aleph.views.forms import RoleSchema, Schema
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

    def test_nested_schema_validation(self):
        class TestSchema(Schema):
            @property
            def schema(self):
                return {
                    "type": "object",
                    "properties": {
                        "level1": {
                            "type": "object",
                            "properties": {
                                "level2": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "level3": {
                                                "type": "string",
                                                "format": "language",
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

        data = {
            "level1": {
                "level2": [
                    {
                        "level3": "en"
                    },
                    {
                        "level3": "es"
                    },
                ]
            }
        }
        schema = TestSchema(data)
        expected = {
            "level1": {
                "level2": [
                    {
                        "level3": "eng"
                    },
                    {
                        "level3": "spa"
                    },
                ]
            }
        }
        self.assertDictEqual(schema.validate(), expected)
