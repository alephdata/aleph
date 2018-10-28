import logging
from normality import stringify
from followthemoney import model

from aleph.core import db

log = logging.getLogger(__name__)


class EntityTag(db.Model):
    """A record reflects a inferred property extracted from a document."""
    VALUE_LENGTH = 1024

    id = db.Column(db.BigInteger, primary_key=True)
    origin = db.Column(db.Unicode(64), nullable=False, index=True)
    entity_id = db.Column(db.Unicode(64), nullable=False, index=True)
    qname = db.Column(db.Unicode(255), nullable=False, index=True)
    score = db.Column(db.Float)
    value = db.Column(db.Unicode(VALUE_LENGTH))

    @property
    def prop(self):
        return model.get_qname(self.qname)

    @classmethod
    def create(cls, origin, entity_id, prop, value, score=1.0):
        value = stringify(value)
        if value is None:
            return
        obj = cls()
        obj.origin = origin
        obj.entity_id = entity_id
        obj.qname = prop.qname
        obj.value = value[:cls.VALUE_LENGTH]
        obj.score = score
        db.session.add(obj)
        return obj

    def __repr__(self):
        return '<EntityTag(%r,%r,%r)>' % (self.entity_id, self.qname, self.value)  # noqa
