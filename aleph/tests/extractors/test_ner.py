from aleph.tests.util import TestCase

from aleph.logic.extractors.aggregate import EntityAggregator
from aleph.logic.extractors.extract import extract_polyglot, extract_spacy


class TestNER(TestCase):

    def test_polyglot(self):
        ctx = EntityAggregator()
        text = """This is a document about the United States. But also about
        Syria and Germany.
        """
        text = text + text + text + text
        entities = extract_polyglot(ctx, text, 'en')
        entities = [str(r) for r in entities]
        assert 'United States' in entities, entities
        assert 'Germany' in entities, entities
        assert 'Syria' in entities, entities

    def test_spacy(self):
        ctx = EntityAggregator()
        text = """This is a document about the United States. But also about
        Syria and Germany.
        """
        text = text + text + text + text
        entities = extract_spacy(ctx, text, 'en')
        entities = [str(r) for r in entities]
        assert 'United States' in entities, entities
        assert 'Germany' in entities, entities
        assert 'Syria' in entities, entities
