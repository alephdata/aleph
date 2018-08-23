import os
import shelve
from banal import ensure_list
from normality import normalize


class LocationResolver(object):
    DB_PATH = os.environ['GEONAMES_DB_PATH']

    def __init__(self):
        self.db = shelve.open(self.DB_PATH)

    def normalize(self, location):
        return normalize(location)

    def get_countries(self, location):
        location = self.normalize(location)
        if location is None:
            return []
        return ensure_list(self.db.get(location))
