import logging
# from aleph.core import db

log = logging.getLogger(__name__)


class Analyzer(object):

    def __init__(self, document, meta):
        self.disabled = False
        self.document = document
        self.meta = meta

    def prepare(self):
        pass

    def on_text(self, text):
        pass

    def finalize(self):
        pass
