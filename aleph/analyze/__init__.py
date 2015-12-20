import logging

from aleph.core import celery


log = logging.getLogger(__name__)


@celery.task()
def analyze_source(source_id):
    pass


@celery.task()
def analyze_matches(query):
    pass


@celery.task()
def analyze_document(document_id):
    pass
