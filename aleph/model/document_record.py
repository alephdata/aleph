import six
import logging
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db

log = logging.getLogger(__name__)


class DocumentRecord(db.Model):
    """A record reflects a row or page of a document."""

    id = db.Column(db.BigInteger, primary_key=True)
    sheet = db.Column(db.Integer, nullable=True)
    index = db.Column(db.Integer, nullable=True, index=True)
    text = db.Column(db.Unicode, nullable=True)
    data = db.Column(JSONB, nullable=True)

    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'), index=True)  # noqa
    document = db.relationship("Document", backref=db.backref('records', cascade='all, delete-orphan'))  # noqa

    @property
    def texts(self):
        """Utility method to get all text snippets in a record."""
        if self.data is not None:
            for value in self.data.values():
                if isinstance(value, six.text_type):
                    yield value
        if self.text is not None:
            yield self.text

    @classmethod
    def find_records(cls, ids):
        if not len(ids):
            return []
        q = db.session.query(cls)
        q = q.filter(cls.id.in_(ids))
        return q

    @classmethod
    def by_index(cls, document_id, index):
        q = db.session.query(cls)
        q = db.session.query(DocumentRecord)
        q = q.filter(cls.document_id == document_id)
        q = q.filter(cls.index == index)
        return q.first()

    def __repr__(self):
        return '<DocumentRecord(%r,%r)>' % (self.document_id, self.index)
