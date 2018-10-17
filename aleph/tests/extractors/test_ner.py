from aleph.tests.util import TestCase

from aleph.logic.extractors.aggregate import EntityAggregator
from aleph.logic.extractors.extract import extract_entities


class TestNER(TestCase):

    def test_ner_service(self):
        ctx = EntityAggregator()
        text = """This is a document about the United States. But also about
        Syria and Germany.
        """
        text = text + text + text + text
        entities = extract_entities(ctx, text, 'en')
        entities = [str(r) for r in entities]
        assert 'United States' in entities, entities
        assert 'Germany' in entities, entities
        assert 'Syria' in entities, entities
