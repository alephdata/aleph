from aleph.core import db
from aleph.model.common import TimeStampedModel


class Permission(db.Model, TimeStampedModel):
    """ A set of rights granted to a role on a resource. """
    __tablename__ = 'permission'

    WATCHLIST = 'watchlist'
    SOURCE = 'source'
    RESOURCE_TYPES = [WATCHLIST, SOURCE]

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), index=True)
    read = db.Column(db.Boolean, default=False)
    write = db.Column(db.Boolean, default=False)
    resource_id = db.Column(db.Integer, nullable=False)
    resource_type = db.Column(db.Enum(*RESOURCE_TYPES, name='permission_type'),
                              nullable=False)

    def to_dict(self):
        return {
            # 'id': self.id,
            'role': self.role_id,
            'read': self.read,
            'write': self.write,
            'resource_id': self.resource_id,
            'resource_type': self.resource_type
        }
