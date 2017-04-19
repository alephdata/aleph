from aleph.core import db
from aleph.model.common import SoftDeleteModel, IdModel
from aleph.model.role import Role


class Permission(db.Model, IdModel, SoftDeleteModel):
    """A set of rights granted to a role on a resource."""

    __tablename__ = 'permission'

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    read = db.Column(db.Boolean, default=False)
    write = db.Column(db.Boolean, default=False)
    collection_id = db.Column(db.Integer, nullable=False)

    @classmethod
    def grant_foreign(cls, collection, foreign_id, read, write):
        role = Role.by_foreign_id(foreign_id)
        if role is None:
            return
        cls.grant_collection(collection.id, role, read, write)

    @classmethod
    def grant_collection(cls, collection_id, role, read, write):
        permission = cls.by_collection_role(collection_id, role)
        if permission is None:
            permission = Permission()
            permission.role_id = role.id
            permission.collection_id = collection_id
        permission.read = read
        permission.write = write
        db.session.add(permission)
        db.session.flush()
        return permission

    @classmethod
    def by_collection_role(cls, collection_id, role):
        q = cls.all()
        q = q.filter(Permission.role_id == role.id)
        q = q.filter(Permission.collection_id == collection_id)
        permission = q.first()
        return permission

    def to_dict(self):
        return {
            'role_id': self.role_id,
            'role': self.role,
            'read': self.read,
            'write': self.write,
            'collection_id': self.collection_id
        }
