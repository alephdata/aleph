from sqlalchemy.dialects.postgresql import JSONB
from werkzeug.datastructures import MultiDict
from hashlib import sha1

from aleph.core import db
from aleph.model.common import TimeStampedModel


def extract_query(q):
    """Remove parts of the query which do not affect the result set."""
    q = MultiDict(q)
    cleaned = MultiDict()
    for key in q.keys():
        values = q.getlist(key)
        if key == 'q':
            values = [v.strip() for v in values]
        if key.startswith('filter:') or key in ['entity', 'q']:
            for val in values:
                if not isinstance(val, (list, tuple, set)):
                    val = [val]
            for v in val:
                if v is None:
                    continue
                v = unicode(v).lower()
                if len(v):
                    cleaned.add(key, v)
    return cleaned


def query_signature(q):
    """Generate a SHA1 signature for the given query."""
    q = extract_query(q)
    out = sha1()
    for field in q.keys():
        out.update('::' + field.encode('utf-8'))
        for value in set(sorted(q.getlist())):
            out.update('==' + value.encode('utf-8'))
    return out.hexdigest()


class Alert(db.Model, TimeStampedModel):
    """A subscription to notifications on a given query."""

    __tablename__ = 'alert'

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    signature = db.Column(db.Unicode)
    query = db.Column(JSONB)
    max_id = db.Column(db.BigInteger)

    @property
    def label(self):
        return 'foo'

    def to_dict(self):
        return {
            'id': self.id,
            'label': self.label,
            'signature': self.signature,
            'role_id': self.role_id,
            'query': self.query,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @classmethod
    def by_id(cls, id, role=None):
        q = db.session.query(cls).filter_by(id=id)
        if role is not None:
            q = q.filter(cls.role_id == role.id)
        return q.first()

    @classmethod
    def all(cls, role=None):
        q = db.session.query(cls)
        if role is not None:
            q = q.filter(cls.role_id == role.id)
        return q

    @classmethod
    def create(cls, query, role_id):
        alert = cls()
        alert.role_id = role_id
        q = extract_query(query)
        alert.query = q
        alert.signature = query_signature(q)
        db.session.add(alert)
        db.session.flush()
        return alert

    @classmethod
    def exists(cls, query, role):
        q = db.session.query(cls)
        q = q.filter(cls.role_id == role.id)
        q = q.filter(cls.signature == query_signature(query))
        return q.first()

    def delete(self):
        db.session.delete(self)

    def __repr__(self):
        return '<Alert(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label
