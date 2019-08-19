from servicelayer.jobs import Dataset

from aleph.core import kv, cache


def get_active_collection_status():
    key = cache.key('dashboard', 'collection', 'status')
    data = cache.get_complex(key)
    if data is None:
        data = Dataset.get_active_dataset_status(kv)
        cache.set_complex(key, data, expire=120)
    return data
