import io
import csv
import logging
from banal import ensure_list
from servicelayer.cache import make_key, get_redis

from ingestors import settings
from ingestors.analysis.util import tag_key

log = logging.getLogger(__name__)
PLACE_KEY = 'ner*gns'


def place_key(name):
    return make_key(PLACE_KEY, name)


def location_country(location):
    conn = get_redis()
    try:
        key = tag_key(location)
        value = conn.lrange(place_key(key), 0, -1)
        return ensure_list(value)
    except KeyError:
        return []


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
