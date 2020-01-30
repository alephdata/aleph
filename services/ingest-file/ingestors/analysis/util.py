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

TEXT_MIN_LENGTH = 60
TEXT_MAX_LENGTH = 50000


def text_chunks(texts, sep=' ', step=2000):
    chunk, total = [], 0
    for text in texts:
        text = collapse_spaces(text)
        if text is None or len(text) < 5:
            continue
        text = text[:TEXT_MAX_LENGTH]
        chunk.append(text)
        total += len(text)
        if total > step:
            yield sep.join(chunk)
            chunk, total = [], 0
    # if total > TEXT_MIN_LENGTH:
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
