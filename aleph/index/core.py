from aleph.core import app_name


def entity_index():
    """Index that us currently written by new queries."""
    return '%s-entity-v1' % app_name


def entities_index():
    """Combined index to run all queries against."""
    return entity_index()


def record_index():
    """Index that us currently written by new queries."""
    return '%s-record-v1' % app_name


def records_index():
    """Combined index to run all queries against."""
    return record_index()


def collection_index():
    """Index that us currently written by new queries."""
    return '%s-collection-v1' % app_name


def collections_index():
    """Combined index to run all queries against."""
    return collection_index()
