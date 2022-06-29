from dataclasses import dataclass

from aleph.tests.util import TestCase
from aleph.views.serializers import Serializer


@dataclass
class MockResult:
    total = 0
    results = []

    def to_dict(self, serializer=None):
        return {
            "total": self.total,
            "results": self.results,
        }


class SerializerTest(TestCase):
    def setUp(self):
        super(SerializerTest, self).setUp()

    def test_result_size_mismatch(self):
        result = MockResult()
        result.total = 10
        response = Serializer.jsonify_result(result)
        assert response.status_code == 500, response.status_code
        assert (
            response.json["errors"] == "Failed to load expected results."
        ), response.json
