from aleph.core import es_index


def entity_index():
    """Index that us currently written by new queries."""
    return '%s-entity-v1' % es_index


def entities_index():
    """Combined index to run all queries against."""
    return entity_index()


def entity_type():
    """doc_type for all entities."""
    return 'base'


def record_index():
    """Index that us currently written by new queries."""
    return '%s-record-v1' % es_index


def records_index():
    """Combined index to run all queries against."""
    return record_index()


def record_type():
    """doc_type for all records."""
    return 'base'


def collection_index():
    """Index that us currently written by new queries."""
    return '%s-collection-v1' % es_index


def collections_index():
    """Combined index to run all queries against."""
    return collection_index()


def collection_type():
    """doc_type for all collections."""
    return 'base'
