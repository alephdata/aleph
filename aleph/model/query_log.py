import logging
from datetime import datetime
from sqlalchemy import func

from aleph.core import db
from aleph.model.common import IdModel

log = logging.getLogger(__name__)


class QueryLog(db.Model, IdModel):
    """Records a search query conducted by a user."""
    __tablename__ = 'query_log'

    id = db.Column(db.BigInteger, primary_key=True)
    query = db.Column(db.Unicode, nullable=True)
    session_id = db.Column(db.Unicode, nullable=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'),
                        index=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def delete_query(cls, role_id, query):
        pq = db.session.query(cls)
        pq = pq.filter(cls.query == query)
        pq = pq.filter(cls.role_id == role_id)
        pq.delete(synchronize_session=False)

    @classmethod
    def query_log(cls, role_id=None):
        first = func.min(cls.created_at).label('first')
        last = func.max(cls.created_at).label('last')
        count = func.count(cls.id).label('count')
        q = db.session.query(cls.query, first, last, count)
        q = q.filter(cls.role_id == role_id)
        q = q.filter(cls.query != None)  # noqa
        q = q.group_by(cls.query)
        q = q.order_by(last.desc())
        return q

    @classmethod
    def save(cls, role_id, session_id, query):
        obj = cls()
        obj.role_id = role_id
        obj.session_id = session_id
        obj.query = query
        db.session.add(obj)
        return obj

    def __repr__(self):
        return '<QueryLog(%r, %r, %r)>' % \
            (self.query, self.role_id, self.session_id)
