# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

import logging
from datetime import datetime
from normality import stringify
from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.model import Role, Collection
from aleph.model.entityset import EntitySet
from aleph.model.common import iso_text, DatedModel, Status
from aleph.model.common import ENTITY_ID_LEN


log = logging.getLogger(__name__)


class Mapping(db.Model, DatedModel):
    """A mapping to load entities from a table"""

    __tablename__ = "mapping"

    id = db.Column(db.Integer, primary_key=True)
    query = db.Column("query", JSONB)

    role_id = db.Column(db.Integer, db.ForeignKey("role.id"), index=True)
    role = db.relationship(Role, backref=db.backref("mappings", lazy="dynamic"))  # noqa

    collection_id = db.Column(db.Integer, db.ForeignKey("collection.id"), index=True)
    collection = db.relationship(
        Collection, backref=db.backref("mappings", lazy="dynamic")
    )

    entityset_id = db.Column(
        db.String(ENTITY_ID_LEN), db.ForeignKey("entityset.id"), nullable=True
    )
    entityset = db.relationship(
        EntitySet, backref=db.backref("mappings", lazy="dynamic")
    )

    table_id = db.Column(db.String(ENTITY_ID_LEN), index=True)

    disabled = db.Column(db.Boolean, nullable=True)
    last_run_status = db.Column(db.Unicode, nullable=True, default=Status.DEFAULT)
    last_run_err_msg = db.Column(db.Unicode, nullable=True)

    def get_proxy_context(self):
        """Metadata to be added to each generated entity."""
        return {
            "created_at": iso_text(self.created_at),
            "updated_at": iso_text(self.updated_at),
            "role_id": self.role_id,
            "mutable": True,
        }

    def update(self, query=None, table_id=None, entityset_id=None):
        if query:
            self.query = query
        if table_id:
            self.table_id = table_id
        self.entityset_id = entityset_id
        self.updated_at = datetime.utcnow()
        db.session.add(self)

    def set_status(self, status, error=None):
        self.last_run_status = status
        self.last_run_err_msg = error
        self.updated_at = datetime.utcnow()
        db.session.add(self)

    def to_dict(self):
        data = self.to_dict_dates()
        data.update(
            {
                "id": stringify(self.id),
                "query": dict(self.query),
                "role_id": stringify(self.role_id),
                "collection_id": stringify(self.collection_id),
                "entityset_id": stringify(self.entityset_id),
                "table_id": self.table_id,
                "last_run_status": Status.LABEL.get(self.last_run_status),
                "last_run_err_msg": self.last_run_err_msg,
            }
        )
        return data

    @classmethod
    def by_collection(cls, collection_id, table_id=None):
        q = cls.all().filter(cls.collection_id == collection_id)
        if table_id is not None:
            q = q.filter(cls.table_id == table_id)
        return q

    @classmethod
    def delete_by_collection(cls, collection_id):
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq.delete(synchronize_session=False)

    @classmethod
    def delete_by_table(cls, entity_id):
        pq = db.session.query(cls)
        pq = pq.filter(cls.table_id == entity_id)
        pq.delete(synchronize_session=False)

    @classmethod
    def create(cls, query, table_id, collection, role_id, entityset_id=None):
        mapping = cls()
        mapping.role_id = role_id
        mapping.collection_id = collection.id
        mapping.update(query, table_id, entityset_id)
        return mapping

    def __repr__(self):
        return "<Mapping(%r, %r)>" % (self.id, self.table_id)
