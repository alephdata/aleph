import logging
import exactitude
from normality import stringify
from followthemoney.types import TYPES

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


    TYPES = {
        TYPE_PERSON: exactitude.names,
        TYPE_ORGANIZATION: exactitude.names,
        TYPE_EMAIL: exactitude.emails,
        TYPE_PHONE: exactitude.phones,
        TYPE_LOCATION: exactitude.addresses,
        TYPE_IP: exactitude.ips,
        TYPE_IBAN: exactitude.ibans,
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
        type_ = self.TYPES[self.type]
        for (candidate, invert) in TYPES.values():
            if candidate == type_:
                return invert

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


class DocumentTagCollector(object):
    """Utility class to collect and aggregate tags from a particular process.

    This is useful when many tags about the same documented are emitted by a
    particular source."""

    def __init__(self, document, origin):
        self.document = document
        self.origin = origin
        self.keyed = {}

    def emit(self, text, type, key=None, weight=1):
        "Create a tag, this can be called multiple times with the same text."
        cleaner = DocumentTag.TYPES[type]

        text = stringify(text)
        text = cleaner.clean(text, countries=self.document.countries)

        if text is None:
            return

        if len(text) > (DocumentTag.TEXT_LENGTH - 50):
            return

        if (text, type) not in self.keyed:
            self.keyed[(text, type)] = dict(text=text, weight=weight)
        else:
            self.keyed[(text, type)]['weight'] += weight

    def save(self):
        """Flush all existing tags from this origin and store new ones."""
        DocumentTag.delete_by(document_id=self.document.id,
                              origin=self.origin)
        for (text, type), tag in self.keyed.items():
            obj = DocumentTag()
            obj.document_id = self.document.id
            obj.origin = self.origin
            obj.type = type
            obj.text = text
            obj.weight = tag['weight']
            db.session.add(obj)
        db.session.flush()

    def __len__(self):
        return len(self.keyed)
