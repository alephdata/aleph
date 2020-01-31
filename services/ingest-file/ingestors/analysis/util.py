from normality import normalize, collapse_spaces

TAG_PERSON = 'peopleMentioned'
TAG_COMPANY = 'companiesMentioned'
TAG_LANGUAGE = 'detectedLanguage'
TAG_COUNTRY = 'detectedCountry'
TAG_EMAIL = 'emailMentioned'
TAG_PHONE = 'phoneMentioned'
TAG_IBAN = 'ibanMentioned'
TAG_LOCATION = 'location'


def text_chunks(texts, sep=' ', max_chunk=5000):
    """Pre-chew text snippets for NLP and pattern matching."""
    chunk, total = [], 0
    for text in texts:
        text = collapse_spaces(text)
        if text is None or len(text) < 5:
            continue
        # Crudest text splitting code in documented human history.
        # Most of the time, a single page of text is going to be
        # 3000-4000 characters, so this really only kicks in if
        # something weird is happening in the first place.
        for idx in range(0, len(text), max_chunk):
            if total > (max_chunk / 2):
                yield sep.join(chunk)
                chunk, total = [], 0
            snippet = text[idx:idx+max_chunk]
            chunk.append(snippet)
            total += len(snippet)
    if len(chunk):
        yield sep.join(chunk)


def tag_key(label):
    return normalize(label, lowercase=True, ascii=True)
