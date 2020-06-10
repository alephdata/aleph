from ftmstore import Dataset, settings


def get_dataset(name, origin, database_uri=None):
    database_uri = database_uri or settings.DATABASE_URI
    return Dataset(name, origin, database_uri=database_uri)
