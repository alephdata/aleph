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

    def put_text(self, text):
        try:
            self.on_text(text)
        except Exception as ex:
            log.exception(ex)

    def on_text(self, text):
        pass

    def put_page(self, page):
        try:
            self.on_page(page)
        except Exception as ex:
            log.exception(ex)

    def on_page(self, page):
        pass

    def put_record(self, record):
        try:
            self.on_record(record)
        except Exception as ex:
            log.exception(ex)

    def on_record(self, record):
        pass

    def finalize(self):
        pass
