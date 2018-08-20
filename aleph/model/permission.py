from datetime import datetime

from aleph.core import db
from aleph.model.common import SoftDeleteModel, IdModel


class Permission(db.Model, IdModel, SoftDeleteModel):
    """A set of rights granted to a role on a resource."""
    __tablename__ = 'permission'

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    read = db.Column(db.Boolean, default=False)
    write = db.Column(db.Boolean, default=False)
    collection_id = db.Column(db.Integer, nullable=False)

    @classmethod
    def grant(cls, collection, role, read, write):
        permission = cls.by_collection_role(collection, role)
        if permission is None:
            permission = Permission()
            permission.role_id = role.id
            permission.collection_id = collection.id
            db.session.add(permission)
        permission.read = read or write
        permission.write = write
        if not permission.read:
            permission.deleted_at = datetime.utcnow()
        db.session.flush()
        collection.reset_state()
        return permission

    @classmethod
    def by_collection_role(cls, collection, role):
        q = cls.all()
        q = q.filter(Permission.role_id == role.id)
        q = q.filter(Permission.collection_id == collection.id)
        permission = q.first()
        return permission

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at=None):
        if deleted_at is None:
            deleted_at = datetime.utcnow()
        q = db.session.query(cls)
        q = q.filter(cls.collection_id == collection_id)
        q.update({cls.deleted_at: deleted_at},
                 synchronize_session=False)
