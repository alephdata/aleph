from aleph.core import db


class Analyzer(object):

    def analyze(self, document, meta):
        raise NotImplemented()

    def save(self, document, meta):
        document.meta = meta
        db.session.add(document)
        db.session.commit()
