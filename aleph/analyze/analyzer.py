import logging

log = logging.getLogger(__name__)


class Analyzer(object):

    def __init__(self):
        self.disabled = False

    def analyze(self, document):
        pass
