from servicelayer.jobs import Dataset

from aleph.core import kv


def get_active_collection_status():
    data = Dataset.get_active_dataset_status(kv)
    return data
