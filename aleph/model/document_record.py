import logging
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.text import string_value

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

    def text_parts(self):
        """Utility method to get all text snippets in a record."""
        if self.data is not None:
            for value in self.data.values():
                text = string_value(value)
                if text is not None:
                    yield text
        text = string_value(self.text)
        if text is not None:
            yield text

    @classmethod
    def find_records(cls, document_id, ids):
        if not len(ids):
            return []
        q = db.session.query(cls)
        q = q.filter(cls.document_id == document_id)
        q = q.filter(cls.id.in_(ids))
        return q

    def to_dict(self):
        return {
            'id': self.id,
            'sheet': self.sheet,
            'index': self.index,
            'data': self.data,
            'text': self.text,
            'document_id': self.document_id
        }

    def __repr__(self):
        return '<DocumentRecord(%r,%r)>' % (self.document_id, self.index)
