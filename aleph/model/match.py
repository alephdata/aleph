import logging
from normality import stringify
from sqlalchemy import func, or_
from sqlalchemy.orm import aliased

from aleph.core import db
from aleph.model.common import IdModel, DatedModel, ENTITY_ID_LEN

log = logging.getLogger(__name__)


class Match(db.Model, IdModel, DatedModel):
    entity_id = db.Column(db.String(ENTITY_ID_LEN))
    collection_id = db.Column(db.Integer,
                              db.ForeignKey('collection.id'),
                              index=True)
    match_id = db.Column(db.String(ENTITY_ID_LEN))
    match_collection_id = db.Column(db.Integer,
                                    db.ForeignKey('collection.id'),
                                    index=True)
    score = db.Column(db.Float(), nullable=True)

    def to_dict(self):
        data = self.to_dict_dates()
        data.update({
            'id': stringify(self.id),
            'score': self.score,
            'entity_id': stringify(self.entity_id),
            'collection_id': stringify(self.collection_id),
            'match_id': stringify(self.match_id),
            'match_collection_id': stringify(self.match_collection_id)
        })
        return data

    @classmethod
    def find_by_collection(cls, collection_id, other_id):
        q = Match.all()
        q = q.filter(Match.collection_id == collection_id)
        q = q.filter(Match.match_collection_id == other_id)
        q = q.order_by(Match.score.desc())
        q = q.order_by(Match.id)
        return q

    @classmethod
    def delete_by_collection(cls, collection_id, deleted_at=None):
        q = db.session.query(cls)
        q = q.filter(or_(
            cls.collection_id == collection_id,
            cls.match_collection_id == collection_id
        ))
        q.delete(synchronize_session=False)

    @classmethod
    def group_by_collection(cls, collection_id, authz=None):
        from aleph.model import Collection, Permission
        cnt = func.count(Match.id).label('matches')
        parent = Match.collection_id.label('parent')
        coll = aliased(Collection, name='collection')
        q = db.session.query(cnt, parent)
        q = q.filter(Match.collection_id == collection_id)
        q = q.filter(Match.match_collection_id != collection_id)
        q = q.join(coll, Match.match_collection_id == coll.id)
        q = q.filter(coll.deleted_at == None)  # noqa
        if authz is not None and not authz.is_admin:
            q = q.join(Permission,
                       Match.match_collection_id == Permission.collection_id)
            q = q.filter(Permission.deleted_at == None)  # noqa
            q = q.filter(Permission.read == True)  # noqa
            q = q.filter(Permission.role_id.in_(authz.roles))
        q = q.add_entity(coll)
        q = q.group_by(coll, parent)
        q = q.order_by(cnt.desc())
        q = q.order_by(parent.asc())
        return q

    def __repr__(self):
        tmpl = 'Match(%r, %r, %r)'
        return tmpl % (self.entity_id, self.match_id, self.score)
