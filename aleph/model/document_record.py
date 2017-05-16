import logging
from hashlib import sha1
from sqlalchemy import or_, and_
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.text import string_value

log = logging.getLogger(__name__)


class DocumentPage(db.Model):

    id = db.Column(db.BigInteger, primary_key=True)
    number = db.Column(db.Integer(), nullable=False)
    text = db.Column(db.Unicode(), nullable=False)
    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'), index=True)  # noqa
    document = db.relationship("Document", backref=db.backref('pages', cascade='all, delete-orphan'))  # noqa

    @property
    def tid(self):
        tid = sha1(str(self.document_id))
        tid.update(str(self.id))
        return tid.hexdigest()

    def __repr__(self):
        return '<DocumentPage(%r,%r)>' % (self.document_id, self.number)

    def text_parts(self):
        """Utility method to get all text snippets in a record."""
        text = string_value(self.text)
        if text is not None:
            yield self.text

    def to_dict(self):
        return {
            'id': self.id,
            'number': self.number,
            'text': self.text,
            'document_id': self.document_id
        }


class DocumentRecord(db.Model):

    id = db.Column(db.BigInteger, primary_key=True)
    sheet = db.Column(db.Integer, nullable=True)
    row_id = db.Column(db.Integer, nullable=True)
    index = db.Column(db.Integer, nullable=True)
    text = db.Column(db.Unicode, nullable=True)
    data = db.Column(JSONB, nullable=True)
    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'), index=True)  # noqa
    document = db.relationship("Document", backref=db.backref('records', cascade='all, delete-orphan'))  # noqa

    @property
    def tid(self):
        tid = sha1(str(self.document_id))
        tid.update(str(self.sheet))
        tid.update(str(self.row_id))
        return tid.hexdigest()

    def text_parts(self):
        """Utility method to get all text snippets in a record."""
        for value in self.data.values():
            text = string_value(value)
            if text is not None:
                yield value

    @classmethod
    def find_rows(cls, document_id, rows):
        if not len(rows):
            return []
        q = db.session.query(cls)
        q = q.filter(cls.document_id == document_id)
        clauses = [and_(cls.sheet == r[0], cls.row_id == r[1]) for r in rows]
        q = q.filter(or_(*clauses))
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
