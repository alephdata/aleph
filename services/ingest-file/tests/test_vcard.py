# -*- coding: utf-8 -*-
from pprint import pprint  # noqa

from .support import TestCase


class VCardTest(TestCase):
    def test_john_doe(self):
        fixture_path, entity = self.fixture("john-doe.vcf")
        self.manager.ingest(fixture_path, entity)
        self.assertSuccess(entity)
        persons = self.get_emitted("Person")
        assert len(persons), persons
        person = persons[0]
        assert "John Doe" in person.get("name")
        assert "+17815551212" in person.get("phone")
