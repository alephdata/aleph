import logging

from sqlalchemy import not_

from aleph.core import db, url_for
from aleph.model.role import Role
from aleph.model.forms import WatchlistForm
from aleph.model.common import TimeStampedModel

log = logging.getLogger(__name__)


class Watchlist(db.Model, TimeStampedModel):
    id = db.Column(db.Integer(), primary_key=True)
    label = db.Column(db.Unicode)
    foreign_id = db.Column(db.Unicode, unique=True, nullable=False)

    creator_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    creator = db.relationship(Role)

    def to_dict(self):
        return {
            'id': self.id,
            'api_url': url_for('watchlists.view', id=self.id),
            'entities_api_url': url_for('entities.index', list=self.id),
            'label': self.label,
            'foreign_id': self.foreign_id,
            'creator_id': self.creator_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    def update(self, data):
        data = WatchlistForm().deserialize(data)
        self.label = data.get('label')

    def delete(self):
        self.delete_entities()
        db.session.delete(self)

    def delete_entities(self, spare=None):
        from aleph.model import Entity, Selector, Reference
        sq = db.session.query(Entity.id)
        if spare is not None:
            sq = sq.filter(not_(Entity.id.in_(spare)))
        sq = sq.filter(Entity.watchlist_id == self.id)
        sq = sq.subquery()

        q = db.session.query(Selector)
        q = q.filter(Selector.entity_id.in_(sq))
        q.delete(synchronize_session='fetch')

        q = db.session.query(Reference)
        q = q.filter(Reference.entity_id.in_(sq))
        q.delete(synchronize_session='fetch')

        q = db.session.query(Entity)
        q = q.filter(Entity.watchlist_id == self.id)
        if spare is not None:
            q = q.filter(not_(Entity.id.in_(spare)))
        q.delete(synchronize_session='fetch')

    @classmethod
    def by_foreign_id(cls, foreign_id, data, role=None):
        q = db.session.query(cls)
        q = q.filter(cls.foreign_id == foreign_id)
        watchlist = q.first()
        if watchlist is None:
            watchlist = cls.create(data, role)
            watchlist.foreign_id = foreign_id
        watchlist.update(data)
        db.session.add(watchlist)
        db.session.flush()
        return watchlist

    @classmethod
    def create(cls, data, role):
        watchlist = cls()
        watchlist.update(data)
        watchlist.creator = role
        db.session.add(watchlist)
        return watchlist

    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()

    @classmethod
    def all(cls, watchlist_ids=None):
        q = db.session.query(cls)
        if watchlist_ids is not None:
            q = q.filter(cls.id.in_(watchlist_ids))
        q = q.order_by(cls.id.desc())
        return q

    @property
    def terms(self):
        from aleph.model.entity import Entity, Selector
        q = db.session.query(Selector.text)
        q = q.join(Entity, Entity.id == Selector.entity_id)
        q = q.filter(Entity.watchlist_id == self.id)
        q = q.distinct()
        return set([r[0] for r in q])

    def __repr__(self):
        return '<Watchlist(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label
