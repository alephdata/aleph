import io
import csv
import logging
from normality import normalize
from servicelayer.cache import make_key

from aleph.core import settings, kv

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
TEXT_MAX_LENGTH = 900000


def check_text_length(text):
    if text is None:
        return False
    if len(text) < TEXT_MIN_LENGTH or len(text) > TEXT_MAX_LENGTH:
        return False
    return True


def tag_key(label):
    return normalize(label, lowercase=True, ascii=True)


def place_key(name):
    return make_key(PLACE_KEY, name)


def load_places():
    if kv.get(PLACE_KEY) or settings.TESTING:
        return
    total = 0
    pipe = kv.pipeline(transaction=False)
    log.info("Loading geonames...")
    with io.open(settings.GEONAMES_DATA, 'r', encoding='utf-8') as fh:
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
