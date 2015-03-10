import os
import logging

from loadkit.types.stage import Stage
from loadkit.operators.common import SourceOperator

from aleph.search.indexer import index_package

log = logging.getLogger(__name__)


class IndexerOperator(SourceOperator):

    DEFAULT_SOURCE = os.path.join(Stage.GROUP, 'plain.txt')
    DEFAULT_NORM = os.path.join(Stage.GROUP, 'normalized.txt')

    def analyze(self, source):
        normalized = source.package.get_resource(self.DEFAULT_NORM)
        index_package(source.package, source, normalized)
