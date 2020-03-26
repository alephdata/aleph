import logging
from itertools import chain
from datetime import datetime
from normality import stringify

from aleph.core import db
from aleph.model.common import DatedModel
from aleph.model.common import ENTITY_ID_LEN

log = logging.getLogger(__name__)


class Linkage(db.Model, DatedModel):
    """Linkages establish a link between an entity and a profile.
    They can express either that an entity is likely part of the
    profile, that it certainly is part of the profile or that it
    is certainly not part of the profile.
    """
    id = db.Column(db.BigInteger, primary_key=True)
    profile_id = db.Column(db.String(ENTITY_ID_LEN), index=True)
    entity_id = db.Column(db.String(ENTITY_ID_LEN), index=True)
    collection_id = db.Column(db.Integer, db.ForeignKey('collection.id'), index=True)  # noqa
    decision = db.Column(db.Boolean, default=None, nullable=True)
    decider_id = db.Column(db.Integer, db.ForeignKey('role.id'))
    context_id = db.Column(db.Integer, db.ForeignKey('role.id'))

    def to_dict(self):
        data = self.to_dict_dates()
        data.update({
            'id': stringify(self.id),
            'profile_id': self.profile_id,
            'entity_id': self.entity_id,
            'collection_id': self.collection_id,
            'decision': self.decision,
            'decider_id': stringify(self.decider_id),
            'context_id': stringify(self.context_id),
        })
        return data

    @classmethod
    def save(cls, profile_id, entity_id, collection_id, context_id,
             decision=None, decider_id=None):
        q = cls.by_profile(profile_id)
        q = q.filter(cls.entity_id == entity_id)
        q = q.filter(cls.collection_id == collection_id)
        q = q.filter(cls.context_id == context_id)
        obj = q.first()
        if obj is None:
            obj = cls()
            obj.profile_id = profile_id
            obj.entity_id = entity_id
            obj.collection_id = collection_id
            obj.context_id = context_id
            obj.created_at = datetime.utcnow()
            obj.decider_id = decider_id
        if decision != obj.decision:
            obj.decision = decision
            obj.decider_id = decider_id
            obj.updated_at = datetime.utcnow()
        db.session.add(obj)
        return obj

    @classmethod
    def merge(cls, target_id, source_id):
        """Merge two profiles into one. This is irreversible, i.e. after
        merging the profiles there is no way of knowing which of the two
        original profiles an entity had been assigned to."""
        keyed = {}
        ids = (target_id, source_id)
        target_id, source_id = max(ids), min(ids)
        linkages = chain(cls.by_profile(target_id), cls.by_profile(source_id))
        for linkage in linkages:
            if linkage.decision is None:
                db.session.delete(linkage)
                continue
            existing = keyed.get(linkage.entity_id)
            if existing is not None:
                if existing.decision is True:
                    db.session.delete(linkage)
                    linkage = existing
                else:
                    db.session.delete(existing)
            if linkage.profile_id != target_id:
                linkage.profile_id = target_id
                linkage.updated_at = datetime.utcnow()
                db.session.add(linkage)
            keyed[linkage.entity_id] = linkage

    @classmethod
    def delete_by_collection(cls, collection_id):
        pq = db.session.query(cls)
        pq = pq.filter(cls.collection_id == collection_id)
        pq.delete(synchronize_session=False)

    @classmethod
    def delete_by_entity(cls, entity_id):
        pq = db.session.query(cls)
        pq = pq.filter(cls.entity_id == entity_id)
        pq.delete(synchronize_session=False)

    @classmethod
    def by_profile(cls, profile_id):
        q = cls.all()
        q = q.filter(cls.profile_id == profile_id)
        return q

    @classmethod
    def by_entity(cls, entity_id, decision=None, collection_id=None,
                  context_id=None):
        q = cls.all()
        q = q.filter(cls.entity_id == entity_id)
        if decision is not None:
            q = q.filter(cls.decision == decision)
        if collection_id is not None:
            q = q.filter(cls.collection_id == collection_id)
        if context_id is not None:
            q = q.filter(cls.context_id == context_id)
        return q

    @classmethod
    def by_authz(cls, authz):
        q = cls.all()
        q = q.filter(cls.context_id.in_(authz.private_roles))
        return q

    # def __repr__(self):
    #     return '<Linkage(%r, %r, %s)>' % \
    #         (self.profile_id, self.entity_id, self.decision)
