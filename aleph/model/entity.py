import logging
from datetime import datetime

# from sqlalchemy import or_, func
# from sqlalchemy.orm import aliased
# from sqlalchemy.dialects.postgresql import JSONB

from aleph.core import db
from aleph.util import find_subclasses
from aleph.model.collection import Collection
from aleph.model.validation import SchemaModel
from aleph.model.common import SoftDeleteModel, IdModel
from aleph.model.entity_util import SchemaDispatcher

log = logging.getLogger(__name__)


class Entity(db.Model, IdModel, SoftDeleteModel, SchemaModel,
             SchemaDispatcher):
    _schema = 'entity/entity.json#'

    name = db.Column(db.Unicode)
    discriminator = db.Column('type', db.String(255), index=True)
    summary = db.Column(db.Unicode, nullable=True)
    description = db.Column(db.Unicode, nullable=True)
    jurisdiction_code = db.Column(db.Unicode, nullable=True)

    __mapper_args__ = {
        'polymorphic_on': discriminator,
        'polymorphic_identity': _schema
    }

    collection_id = db.Column(db.Integer(), db.ForeignKey('collection.id'))
    collection = db.relationship(Collection, backref=db.backref('entities', lazy='dynamic', cascade='all, delete-orphan'))  # noqa

    def delete(self):
        from aleph.model import Reference
        q = db.session.query(Reference)
        q = q.filter(Reference.entity_id == self.id)
        q.delete(synchronize_session='fetch')
        super(Entity, self).delete()

    def update(self, data):
        self.schema_update(data)

    @classmethod
    def save(cls, data):
        if 'id' in data and data.get('id'):
            # TODO: use identifiers as well
            ent = cls.by_id(data['id'])
            print 'ENTITY', type(ent)
            ent.update(data)
            return ent
        else:
            schema = data.get('$schema', cls._schema)
            if schema != cls._schema:
                for subcls in find_subclasses(cls):
                    if subcls._schema == schema:
                        cls = subcls
            ent = cls()
            ent.update(data)
            return ent

    @property
    def terms(self):
        return []  # FIXME

    @classmethod
    def by_id_set(cls, ids, collection_id=None):
        if not len(ids):
            return {}
        q = cls.all()
        q = q.filter(cls.id.in_(ids))
        if collection_id is not None:
            q = q.filter(cls.collection_id == collection_id)
        entities = {}
        for ent in q:
            entities[ent.id] = ent
        return entities

    # @classmethod
    # def suggest_prefix(cls, prefix, collections, limit=10):
    #     if prefix is None or not len(prefix):
    #         return []
    #     prefix = prefix.strip()
    #     ent = aliased(Entity)
    #     sel = aliased(Selector)
    #     count = func.count(sel.id)
    #     q = db.session.query(ent.id, ent.name, ent.category, count)
    #     q = q.join(sel, ent.id == sel.entity_id)
    #     q = q.filter(ent.deleted_at == None)  # noqa
    #     q = q.filter(ent.collection_id.in_(collections))
    #     q = q.filter(or_(sel.text.ilike('%s%%' % prefix),
    #                      sel.text.ilike('%% %s%%' % prefix)))
    #     q = q.group_by(ent.id, ent.name, ent.category)
    #     q = q.order_by(count.desc())
    #     q = q.limit(limit)
    #     suggestions = []
    #     for entity_id, name, category, count in q.all():
    #         suggestions.append({
    #             'id': entity_id,
    #             'name': name,
    #             'category': category
    #         })
    #     return suggestions

    def __repr__(self):
        return '<Entity(%r, %r)>' % (self.id, self.name)

    def __unicode__(self):
        return self.name

    def to_dict(self):
        data = super(Entity, self).to_dict()
        data['collection_id'] = self.collection_id
        return data


class EntityAsset(Entity):
    _schema = 'entity/asset.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    register_name = db.Column(db.Unicode, nullable=True)
    valuation = db.Column(db.Integer, nullable=True)
    valuation_currency = db.Column(db.Unicode(100), nullable=True)
    valuation_date = db.Column(db.Date, nullable=True)


class EntityLegalPerson(Entity):
    _schema = 'entity/legal_person.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    image = db.Column(db.Unicode, nullable=True)


class EntityLand(EntityAsset):
    _schema = 'entity/land.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    parcel_number = db.Column(db.Unicode, nullable=True)
    parcel_name = db.Column(db.Unicode, nullable=True)
    parcel_area = db.Column(db.Integer, nullable=True)
    parcel_area_units = db.Column(db.Unicode, nullable=True)
    usage_code = db.Column(db.Unicode, nullable=True)
    usage_name = db.Column(db.Unicode, nullable=True)


class EntityBuilding(EntityAsset):
    _schema = 'entity/building.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    # TODO: address


class EntityPerson(EntityLegalPerson):
    _schema = 'entity/person.json#'
    __mapper_args__ = {
        'polymorphic_identity': _schema
    }

    gender = db.Column(db.Unicode, nullable=True)
    birth_date = db.Column(db.Date, nullable=True)
    death_date = db.Column(db.Date, nullable=True)
