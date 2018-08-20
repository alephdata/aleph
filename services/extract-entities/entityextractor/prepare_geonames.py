import io
import csv
import shelve
import os

from normality import normalize

GEONAMES_DB_PATH = os.environ['GEONAMES_DB_PATH']
CORPUS_PATH = os.environ['CORPUS_PATH']


def prepare_geonames():
    with io.open(CORPUS_PATH, 'r', encoding='utf-8') as fh:
        with shelve.open(GEONAMES_DB_PATH) as db:
            for row in csv.reader(fh, delimiter='\t'):
                country = normalize(row[8])
                if country is None:
                    continue
                names = set(row[3].split(','))
                names.add(row[1])
                names.add(row[2])
                for name in names:
                    name = normalize(name)
                    if name is None:
                        continue
                    countries = db.get(name)
                    if countries:
                        countries.append(country)
                        db[name] = countries
                    else:
                        db[name] = [country]
            for name in db:
                countries = db[name]
                db[name] = max(set(countries), key=countries.count)


if __name__ == "__main__":
    prepare_geonames()
