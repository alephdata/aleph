import logging
from datetime import datetime

from sqlalchemy.orm import aliased

from aleph.core import db
from aleph.model.entity import Entity


log = logging.getLogger(__name__)


class EntityTag(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    collection = db.Column(db.Unicode(100))
    package_id = db.Column(db.Unicode(100))

    entity_id = db.Column(db.Unicode(50), db.ForeignKey('entity.id'))
    entity = db.relationship(Entity, backref=db.backref('tags',
                                                        lazy='dynamic'))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def delete_set(cls, collection, package_id):
        q = db.session.query(cls)
        q = q.filter_by(collection=collection)
        q = q.filter_by(package_id=package_id)
        q.delete()

    @classmethod
    def by_package(cls, collection, package_id):
        etag = aliased(cls)
        ent = aliased(Entity)
        q = db.session.query(etag.entity_id, ent.label,
                             ent.category, ent.list_id)
        q = q.join(ent, ent.id == etag.entity_id)
        q = q.filter(etag.collection == collection)
        q = q.filter(etag.package_id == package_id)
        entities = []
        for entity_id, label, category, lst in q.all():
            entities.append({
                'id': entity_id,
                'entity': entity_id,
                'label': label,
                'category': category,
                'list': lst
            })
        return entities

    def __repr__(self):
        return '<EntityTag(%r, %r)>' % (self.package_id, self.entity_id)
