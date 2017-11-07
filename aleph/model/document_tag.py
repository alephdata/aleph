import logging
import exactitude
from normality import slugify

from aleph.core import db
from aleph.model.common import IdModel

log = logging.getLogger(__name__)


class DocumentTag(db.Model, IdModel):
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


class DocumentTagCollector(object):
    """Utility class to collect and aggregate tags from a particular process.

    This is useful when many tags about the same documented are emitted by a
    particular source."""

    CLEANERS = {
        DocumentTag.TYPE_PERSON: exactitude.names,
        DocumentTag.TYPE_ORGANIZATION: exactitude.names,
        DocumentTag.TYPE_EMAIL: exactitude.emails,
        DocumentTag.TYPE_PHONE: exactitude.phones,
        DocumentTag.TYPE_LOCATION: exactitude.addresses,
    }

    def __init__(self, document, origin):
        self.document = document
        self.origin = origin
        self.keyed = {}

    def emit(self, text, type, key=None, weight=1):
        "Create a tag, this can be called multiple times with the same text."
        cleaner = self.CLEANERS[type]
        text = cleaner.clean(text, countries=self.document.countries)
        if text is None:
            return

        if key is None:
            key = slugify(text, sep='-')

        if (key, type) not in self.keyed:
            self.keyed[(key, type)] = dict(text=text, weight=weight)
        else:
            self.keyed[(key, type)]['weight'] += weight

    def save(self):
        """Flush all existing tags from this origin and store new ones."""
        DocumentTag.delete_by(document_id=self.document.id,
                              origin=self.origin)
        for (key, type), tag in self.keyed.items():
            obj = DocumentTag()
            obj.document_id = self.document.id
            obj.origin = self.origin
            obj.type = type
            obj.key = key
            obj.text = tag['text']
            obj.weight = tag['weight']
            db.session.add(obj)
        db.session.flush()

    def __len__(self):
        return len(self.keyed)
