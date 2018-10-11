import io
import csv
import logging
from ahocorasick import Automaton
from collections import defaultdict
from normality import normalize

from aleph import settings

log = logging.getLogger(__name__)


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
    places = defaultdict(set)
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
                    places[name].add(country)
    return places


def places_automaton():
    if not hasattr(settings, '_geonames'):
        log.debug("Loading geonames...")
        geonames = Automaton()
        places = load_places()
        for (name, countries) in places.items():
            geonames.add_word(name, countries)
        geonames.make_automaton()
        settings._geonames = geonames
        log.debug("Loaded %s geonames.", len(places))
    return settings._geonames
