import logging

from docpipe.pipeline import Pipeline
from docpipe.exc import DocpipeException

log = logging.getLogger(__name__)

# TODO make this flexible?
CONFIG = {
    'process': {
        'plain_text': {
            'operator': 'extract'
        },
        'normalized_text': {
            'operator': 'normalize',
            'requires': ['plain_text']
        },
        'index': {
            'operator': 'aleph_indexer',
            'requires': ['plain_text', 'normalized_text']
        }
    }
}


def make_pipeline(collection):
    log.info('Constructing pipeline for collection %r', collection)
    try:
        pipeline = Pipeline(collection, 'aleph_process', config=CONFIG)
        return pipeline
    except DocpipeException, de:
        log.exception(de)
