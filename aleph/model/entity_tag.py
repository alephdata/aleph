import logging
from datetime import datetime

from aleph.core import db


log = logging.getLogger(__name__)


class EntityTag(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    collection = db.Column(db.Unicode(100))
    package_id = db.Column(db.Unicode(100))

    entity_id = db.Column(db.Integer(), db.ForeignKey('entity.id'))
    entity = db.relationship('Entity', backref=db.backref('tags',
                                                          lazy='dynamic'))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def delete_set(cls, collection, package_id):
        q = db.session.query(cls)
        q = q.filter_by(collection=collection)
        q = q.filter_by(package_id=package_id)
        q.delete()

    def __repr__(self):
        return '<EntityTag(%r, %r)>' % (self.package_id, self.entity_id)
