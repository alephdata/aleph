import logging
# from aleph.core import db

log = logging.getLogger(__name__)


class Analyzer(object):

    def __init__(self, document):
        self.disabled = False
        self.document = document

    def prepare(self):
        pass

    def on_text(self, text):
        pass

    def finalize(self):
        pass
