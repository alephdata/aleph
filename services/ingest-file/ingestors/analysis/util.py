import io
import csv
import logging
from servicelayer.cache import make_key, get_redis
from normality import normalize, collapse_spaces

from ingestors import settings

log = logging.getLogger(__name__)
PLACE_KEY = 'ner*gns'

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


def place_key(name):
    return make_key(PLACE_KEY, name)


def load_places():
    conn = get_redis()
    if conn.get(PLACE_KEY) or settings.TESTING:
        return
    total = 0
    pipe = conn.pipeline(transaction=False)
    log.info("Loading geonames...")
    with io.open(settings.GEONAMES_PATH, 'r', encoding='utf-8') as fh:
        for row in csv.reader(fh, delimiter='\t'):
            country = row[8].lower().strip()
            if not len(country):
                continue
            names = set(row[3].split(','))
            names.add(row[1])
            names.add(row[2])
            for name in names:
                name = tag_key(name)
                if name is not None:
                    total += 1
                    pipe.lpush(place_key(name), country)
    pipe.set(PLACE_KEY, total)
    pipe.execute()
    log.info("Loaded %s geonames.", total)
