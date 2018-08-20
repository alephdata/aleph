from entityextractor.extract import extract_polyglot, extract_spacy


def test_polyglot():
    text = """This is a document about the United States. But also about
    Syria and Germany.
    """
    entities = extract_polyglot(text, 'en')
    entities = [l for l, c, _, _ in entities]
    assert 'United States' in entities
    assert 'Germany' in entities
    assert 'Syria' in entities


def test_spacy():
    text = """This is a document about the United States. But also about
    Syria and Germany.
    """
    entities = extract_spacy(text, 'en')
    entities = [l for l, c, _, _ in entities]
    assert 'the United States' in entities
    assert 'Germany' in entities
    assert 'Syria' in entities
