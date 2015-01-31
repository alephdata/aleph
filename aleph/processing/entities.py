from aleph.search import raw_iter
from aleph.search.queries import entity_query
from aleph.processing import process_package

BUNCH = 500


def refresh(selectors):
    packages = set()
    selectors = list(selectors)
    for i in xrange(0, len(selectors), BUNCH):
        for doc in raw_iter(entity_query(selectors[i:i + BUNCH])):
            package = (doc['_source']['collection'], doc['_source']['id'])
            if package not in packages:
                process_package.delay(*package)
                packages.add(package)
