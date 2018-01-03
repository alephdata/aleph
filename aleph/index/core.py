from aleph.core import settings


def entity_index():
    """Index that us currently written by new queries."""
    return '%s-entity-v1' % settings.APP_NAME


def entities_index():
    """Combined index to run all queries against."""
    return entity_index()


def record_index():
    """Index that us currently written by new queries."""
    return '%s-record-v1' % settings.APP_NAME


def records_index():
    """Combined index to run all queries against."""
    return record_index()


def collection_index():
    """Index that us currently written by new queries."""
    return '%s-collection-v1' % settings.APP_NAME


def collections_index():
    """Combined index to run all queries against."""
    return collection_index()
