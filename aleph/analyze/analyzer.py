from aleph.core import db
from aleph.model import Document


class Analyzer(object):

    def analyze(self, document, meta):
        if document.type == Document.TYPE_TEXT:
            self.analyze_text(document, meta)
        if document.type == Document.TYPE_TABULAR:
            self.analyze_tabular(document, meta)

    def analyze_text(self, document, meta):
        pass

    def analyze_tabular(self, document, meta):
        pass

    def save(self, document, meta):
        document.meta = meta
        db.session.add(document)
        db.session.commit()
