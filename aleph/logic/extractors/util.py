import io
import csv
import logging
from normality import normalize
from servicelayer.cache import make_key

from aleph.core import settings, kv

log = logging.getLogger(__name__)
PLACE_KEY = 'ner*gns'


def overlaps(a, b):
    rec_a, start_a, end_a = a
    rec_b, start_b, end_b = b
    if rec_a != rec_b:
        return False
    if None in (start_a, start_b, end_a, end_b):
        return False
    max_start = max(start_a, start_b)
    min_end = min(end_a, end_b)
    return (min_end - max_start) > 0


def normalize_label(label):
    return normalize(label, lowercase=True, ascii=True)


def load_places():
    if kv.get(PLACE_KEY) or settings.TESTING:
        return
    total = 0
    pipe = kv.pipeline(transaction=False)
    log.debug("Loading geonames...")
    with io.open(settings.GEONAMES_DATA, 'r', encoding='utf-8') as fh:
        for row in csv.reader(fh, delimiter='\t'):
            country = row[8].lower().strip()
            if not len(country):
                continue
            names = set(row[3].split(','))
            names.add(row[1])
            names.add(row[2])
            for name in names:
                name = normalize_label(name)
                if name is not None:
                    total += 1
                    pipe.lpush(place_key(name), country)
    pipe.set(PLACE_KEY, total)
    pipe.execute()
    log.debug("Loaded %s geonames.", total)


def place_key(name):
    return make_key(PLACE_KEY, name)
