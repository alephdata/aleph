import logging

from aleph.core import db
from aleph.model.common import DatedModel, IdModel

log = logging.getLogger(__name__)


class DocumentTag(db.Model, DatedModel, IdModel):
    """A record reflects an entity or tag extracted from a document."""

    TYPE_PHONE = 'phone'
    TYPE_EMAIL = 'email'
    TYPE_PERSON = 'person'
    TYPE_ORGANIZATION = 'organization'
    TYPE_LOCATION = 'location'

    id = db.Column(db.BigInteger, primary_key=True)
    origin = db.Column(db.Unicode(255), nullable=False, index=True)
    type = db.Column(db.Unicode(16), nullable=False)
    weight = db.Column(db.Integer, default=1)
    key = db.Column(db.Unicode(1024), nullable=False, index=True)
    text = db.Column(db.Unicode(1024), nullable=True)
    display_text = db.Column(db.Unicode(1024), nullable=False)

    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'), index=True)  # noqa
    document = db.relationship("Document", backref=db.backref('tags', cascade='all, delete-orphan'))  # noqa

    @classmethod
    def delete_by(cls, document_id=None, origin=None, type=None):
        pq = db.session.query(cls)
        assert document_id or origin or type
        if document_id is not None:
            pq = pq.filter(cls.document_id == document_id)
        if origin is not None:
            pq = pq.filter(cls.origin == origin)
        if type is not None:
            pq = pq.filter(cls.type == type)
        pq.delete()
        db.session.flush()

    def __repr__(self):
        return '<DocumentTag(%r,%r)>' % (self.document_id, self.key)
