from followthemoney import model
from normality import collapse_spaces


ANALYZABLE = model.get("Analyzable")
TAG_PERSON = ANALYZABLE.get("peopleMentioned")
TAG_COMPANY = ANALYZABLE.get("companiesMentioned")
TAG_LANGUAGE = ANALYZABLE.get("detectedLanguage")
TAG_COUNTRY = ANALYZABLE.get("detectedCountry")
TAG_EMAIL = ANALYZABLE.get("emailMentioned")
TAG_PHONE = ANALYZABLE.get("phoneMentioned")
TAG_IBAN = ANALYZABLE.get("ibanMentioned")
TAG_LOCATION = ANALYZABLE.get("location")


def text_chunks(texts, sep=" ", max_chunk=25000):
    """Pre-chew text snippets for NLP and pattern matching."""
    for text in texts:
        text = collapse_spaces(text)
        if text is None or len(text) < 5:
            continue
        # Crudest text splitting code in documented human history.
        # Most of the time, a single page of text is going to be
        # 3000-4000 characters, so this really only kicks in if
        # something weird is happening in the first place.
        for idx in range(0, len(text), max_chunk):
            yield text[idx : idx + max_chunk]
