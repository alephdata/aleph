# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

from datetime import datetime
from normality import stringify

from aleph.core import db
from aleph.model.common import DatedModel, IdModel


class Permission(db.Model, IdModel, DatedModel):
    """A set of rights granted to a role on a collection."""

    __tablename__ = "permission"

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey("role.id"), index=True)
    read = db.Column(db.Boolean, default=False)
    write = db.Column(db.Boolean, default=False)
    collection_id = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        data = self.to_dict_dates()
        data.update(
            {
                "id": stringify(self.id),
                "role_id": stringify(self.role_id),
                "collection_id": stringify(self.collection_id),
                "read": self.read,
                "write": self.write,
            }
        )
        return data

    @classmethod
    def grant(cls, collection, role, read, write):
        read = read or write
        permission = cls.by_collection_role(collection, role)
        if not read:
            if permission is not None:
                permission.delete()
            return
        if permission is None:
            permission = Permission()
            permission.role_id = role.id
            permission.collection_id = collection.id
        permission.read = True
        permission.write = write
        permission.updated_at = datetime.utcnow()
        db.session.add(permission)
        db.session.flush()
        return permission

    @classmethod
    def by_collection_role(cls, collection, role):
        q = cls.all()
        q = q.filter(Permission.role_id == role.id)
        q = q.filter(Permission.collection_id == collection.id)
        return q.first()

    @classmethod
    def delete_by_collection(cls, collection_id):
        q = db.session.query(cls)
        q = q.filter(cls.collection_id == collection_id)
        q.delete(synchronize_session=False)
