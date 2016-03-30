from aleph.core import db
from aleph.model.common import SoftDeleteModel


class Permission(db.Model, SoftDeleteModel):
    """A set of rights granted to a role on a resource."""

    __tablename__ = 'permission'

    COLLECTION = 'collection'
    SOURCE = 'source'
    RESOURCE_TYPES = [COLLECTION, SOURCE]

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    read = db.Column(db.Boolean, default=False)
    write = db.Column(db.Boolean, default=False)
    resource_id = db.Column(db.Integer, nullable=False)
    resource_type = db.Column(db.Enum(*RESOURCE_TYPES, name='permission_type'),
                              nullable=False)

    @classmethod
    def grant_foreign(cls, resource, foreign_id, read, write):
        from aleph.model import Source, Collection, Role
        role = Role.by_foreign_id(foreign_id)
        if role is None:
            return
        if isinstance(resource, Source):
            cls.grant_resource(cls.SOURCE, resource.id, role, read, write)
        if isinstance(resource, Collection):
            cls.grant_resource(cls.COLLECTION, resource.id, role, read, write)

    @classmethod
    def grant_resource(cls, resource_type, resource_id, role, read, write):
        q = cls.all()
        q = q.filter(Permission.role_id == role.id)
        q = q.filter(Permission.resource_type == resource_type)
        q = q.filter(Permission.resource_id == resource_id)
        permission = q.first()
        if permission is None:
            permission = Permission()
            permission.role_id = role.id
            permission.resource_type = resource_type
            permission.resource_id = resource_id
        permission.read = read
        permission.write = write
        db.session.add(permission)
        return permission

    def to_dict(self):
        return {
            # 'id': self.id,
            'role': self.role_id,
            'read': self.read,
            'write': self.write,
            'resource_id': self.resource_id,
            'resource_type': self.resource_type
        }
