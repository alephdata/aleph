import os
import shelve
from normality import normalize


class LocationResolver(object):
    DB_PATH = os.environ['GEONAMES_DB_PATH']

    def __init__(self):
        self.db = shelve.open(self.DB_PATH)

    def normalize(self, location):
        return normalize(location)

    def get_country(self, location):
        location = self.normalize(location)
        return self.db.get(location, None)
