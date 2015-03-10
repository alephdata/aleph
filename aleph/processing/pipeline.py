import json
import logging

from loadkit.pipeline import Pipeline
from loadkit.util import LoadKitException

log = logging.getLogger(__name__)

# TODO make this flexible?
CONFIG = {
    'process': {
        'plain_text': {
            'operator': 'text_extract'
        },
        'normalized_text': {
            'operator': 'normalize',
            'requires': ['plain_text']
        },
        'entities': {
            'operator': 'aleph_tagger',
            'requires': ['normalized_text']
        },
        'index': {
            'operator': 'aleph_indexer',
            'requires': ['entities', 'plain_text', 'normalized_text']
        }
    }
}


def make_pipeline(collection, overwrite=False):
    # log.info('Constructing pipeline for collection %r', collection)
    config = CONFIG
    if overwrite:
        config = json.loads(json.dumps(config))
        for k, v in config['process'].items():
            config['process'][k]['overwrite'] = True
    try:
        pipeline = Pipeline(collection, 'aleph_process', config=config)
        return pipeline
    except LoadKitException, de:
        log.exception(de)
