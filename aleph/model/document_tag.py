import logging
from followthemoney.types import registry

from aleph.core import db
from aleph.model.common import IdModel

log = logging.getLogger(__name__)


class DocumentTag(db.Model, IdModel):
    """A record reflects an entity or tag extracted from a document."""
    TEXT_LENGTH = 1024

    TYPE_PHONE = 'phone'
    TYPE_EMAIL = 'email'
    TYPE_PERSON = 'person'
    TYPE_ORGANIZATION = 'organization'
    TYPE_LOCATION = 'location'
    TYPE_IP = 'ip'
    TYPE_IBAN = 'iban'
    TYPE_COUNTRY = 'country'
    TYPE_LANGUAGE = 'language'

    MAPPING = {
        TYPE_PERSON: 'namesMentioned',
        TYPE_ORGANIZATION: 'namesMentioned',
        TYPE_EMAIL: 'emailMentioned',
        TYPE_PHONE: 'phoneMentioned',
        TYPE_LOCATION: 'locationMentioned',
        TYPE_IP: 'ipMentioned',
        TYPE_IBAN: 'ibanMentioned',
        TYPE_COUNTRY: 'country',
        TYPE_LANGUAGE: 'language'
    }

    id = db.Column(db.BigInteger, primary_key=True)
    origin = db.Column(db.Unicode(255), nullable=False, index=True)
    type = db.Column(db.Unicode(16), nullable=False)
    weight = db.Column(db.Integer, default=1)
    text = db.Column(db.Unicode(TEXT_LENGTH), nullable=True)

    document_id = db.Column(db.Integer(), db.ForeignKey('document.id'), index=True)  # noqa
    document = db.relationship("Document", backref=db.backref('tags', cascade='all, delete-orphan'))  # noqa

    @property
    def field(self):
        type_ = registry.get(self.type)
        if type_ is not None and type_.group is not None:
            return type_.group

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
        return '<DocumentTag(%r,%r)>' % (self.document_id, self.text)
