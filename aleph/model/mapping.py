import logging
from datetime import datetime
from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB
from flask_babel import lazy_gettext

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.common import SoftDeleteModel, ENTITY_ID_LEN


log = logging.getLogger(__name__)


class Mapping(db.Model, SoftDeleteModel):
    """A mapping to load entities from a table"""
    __tablename__ = 'mapping'

    FAILED = 'failed'
    SUCCESS = 'success'
    STATUS = {
        SUCCESS: lazy_gettext('success'),
        FAILED: lazy_gettext('failed')
    }

    id = db.Column(db.Integer, primary_key=True)
    query = db.Column('query', JSONB)

    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    role = db.relationship(Role, backref=db.backref('mappings', lazy='dynamic'))  # noqa

    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    collection = db.relationship(Collection, backref=db.backref('mappings', lazy='dynamic'))  # noqa

    table_id = db.Column(db.String(ENTITY_ID_LEN), index=True)

    last_run_status = db.Column(db.Unicode, nullable=True)
    last_run_err_msg = db.Column(db.Unicode, nullable=True)

    def update(self, query=None, table_id=None):
        self.updated_at = datetime.utcnow()
        if query:
            self.query = query
        if table_id:
            self.table_id = table_id
        db.session.add(self)
        db.session.commit()

    def set_status(self, status, error=None):
        self.last_run_status = status
        self.last_run_err_msg = error
        db.session.add(self)
        db.session.commit()

    def delete(self, deleted_at=None):
        self.deleted_at = deleted_at or datetime.utcnow()
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        data = self.to_dict_dates()
        status = self.STATUS.get(self.last_run_status)
        data.update({
            'id': stringify(self.id),
            'query': dict(self.query),
            'role_id': stringify(self.role_id),
            'collection_id': stringify(self.collection_id),
            'table_id': self.table_id,
            'last_run_status': status,
            'last_run_err_msg': self.last_run_err_msg
        })
        return data

    @classmethod
    def by_collection(cls, collection_id, table_id=None):
        q = cls.all().filter(cls.collection_id == collection_id)
        if table_id is not None:
            q = q.filter(cls.table_id == table_id)
        return q

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at=None):
        deleted_at = deleted_at or datetime.utcnow()
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq = pq.filter(cls.deleted_at == None)  # noqa
        pq.update({cls.deleted_at: deleted_at},
                  synchronize_session=False)

    @classmethod
    def create(cls, query, table_id, collection, role_id):
        mapping = cls()
        mapping.role_id = role_id
        mapping.query = query
        mapping.collection_id = collection.id
        mapping.table_id = table_id
        mapping.update()
        return mapping

    def __repr__(self):
        return '<Mapping(%r, %r)>' % (self.id, self.table_id)
