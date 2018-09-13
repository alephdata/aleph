import io
import csv
import logging
from threading import RLock
from banal import ensure_list
from normality import normalize
from ahocorasick import Automaton
from collections import defaultdict

from aleph import settings

log = logging.getLogger(__name__)


class LocationResolver(object):

    def __init__(self):
        self.lock = RLock()

    def load_places(self):
        places = defaultdict(set)
        with io.open(settings.GEONAMES_DATA, 'r', encoding='utf-8') as fh:
            for row in csv.reader(fh, delimiter='\t'):
                country = normalize(row[8])
                if country is None:
                    continue
                names = set(row[3].split(','))
                names.add(row[1])
                names.add(row[2])
                for name in names:
                    name = self.normalize(name)
                    if name is None:
                        continue
                    places[name].add(country)
        return places

    @property
    def automaton(self):
        with self.lock:
            if not hasattr(settings, '_geonames'):
                log.debug("Loading geonames data...")
                settings._geonames = Automaton()
                places = self.load_places()
                for (name, countries) in places.items():
                    settings._geonames.add_word(name, countries)
                settings._geonames.make_automaton()
                log.debug("Loaded %s geonames.", len(places))
        return settings._geonames

    def normalize(self, location):
        return normalize(location, lowercase=True, latinize=True)

    def get_countries(self, location):
        location = self.normalize(location)
        if location is None:
            return []
        return ensure_list(self.automaton.get(location))
