from entityextractor.aggregate import EntityAggregator
from entityextractor.extract import extract_polyglot, extract_spacy


def test_polyglot():
    ctx = EntityAggregator()
    text = """This is a document about the United States. But also about
    Syria and Germany.
    """
    entities = extract_polyglot(ctx, text, 'en')
    entities = [str(r) for r in entities]
    assert 'United States' in entities
    assert 'Germany' in entities
    assert 'Syria' in entities


def test_spacy():
    ctx = EntityAggregator()
    text = """This is a document about the United States. But also about
    Syria and Germany.
    """
    entities = extract_spacy(ctx, text, 'en')
    entities = [str(r) for r in entities]
    assert 'the United States' in entities
    assert 'Germany' in entities
    assert 'Syria' in entities
