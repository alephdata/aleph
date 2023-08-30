from dataclasses import dataclass
from werkzeug.exceptions import InternalServerError

from aleph.tests.util import TestCase
from aleph.views.serializers import Serializer


@dataclass
class MockResult:
    total = 0
    offset = 0
    limit = 99
    results = []

    def to_dict(self, serializer=None):
        return {
            "total": self.total,
            "results": self.results,
            "limit": self.limit,
            "offset": self.offset,
        }


class SerializerTest(TestCase):
    def setUp(self):
        super(SerializerTest, self).setUp()

    def test_result_size_mismatch(self):
        result = MockResult()
        result.total = 10
        with self.assertRaises(InternalServerError) as context:
            Serializer.jsonify_result(result)

        self.assertIn(
            "We found 10 results, but could not load them", str(context.exception)
        )

    def test_result_size_mismatch_limit_zero(self):
        """Results can be empty if limit is 0"""
        result = MockResult()
        result.total = 10
        result.limit = 0
        Serializer.jsonify_result(result)

    def test_result_size_mismatch_offset_larger_than_total(self):
        """Results can be empty if offset >= total results"""
        result = MockResult()
        result.total = 10
        result.offset = 10
        Serializer.jsonify_result(result)
