import logging
from banal import as_bool
from datetime import datetime
from flask.ext.babel import lazy_gettext
from sqlalchemy.dialects.postgresql import ARRAY

from aleph.core import db
from aleph.model.role import Role
from aleph.model.permission import Permission
from aleph.model.common import IdModel, make_textid
from aleph.model.common import SoftDeleteModel

log = logging.getLogger(__name__)


class Collection(db.Model, IdModel, SoftDeleteModel):
    """A set of documents and entities against which access control is
    enforced."""

    # Category schema for collections.
    # TODO: add extra weight info.
    # TODO: should this be configurable?
    CATEGORIES = {
        'news': lazy_gettext('News archives'),
        'leak': lazy_gettext('Leaks'),
        'land': lazy_gettext('Land registry'),
        'gazette': lazy_gettext('Gazettes'),
        'court': lazy_gettext('Court archives'),
        'company': lazy_gettext('Company registries'),
        'watchlist': lazy_gettext('Watchlists'),
        'investigation': lazy_gettext('Personal collections'),
        'sanctions': lazy_gettext('Sanctions lists'),
        'scrape': lazy_gettext('Scrapes'),
        'procurement': lazy_gettext('Procurement'),
        'grey': lazy_gettext('Grey literature'),
        'license': lazy_gettext('Licenses and concessions'),
        'regulatory': lazy_gettext('Regulatory filings'),
        'other': lazy_gettext('Other material')
    }

    DEFAULT = 'other'

    label = db.Column(db.Unicode)
    summary = db.Column(db.Unicode, nullable=True)
    category = db.Column(db.Unicode, nullable=True)
    countries = db.Column(ARRAY(db.Unicode()), default=[])
    languages = db.Column(ARRAY(db.Unicode()), default=[])
    foreign_id = db.Column(db.Unicode, unique=True, nullable=False)
    publisher = db.Column(db.Unicode, nullable=True)
    publisher_url = db.Column(db.Unicode, nullable=True)
    info_url = db.Column(db.Unicode, nullable=True)
    data_url = db.Column(db.Unicode, nullable=True)

    # A casefile is a type of collection which is used to manage the state
    # of an investigation. Unlike normal collections, cases do not serve
    # as source material, but as a mechanism of analysis.
    casefile = db.Column(db.Boolean, default=False)

    creator_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    creator = db.relationship(Role)

    def update(self, data, creator=None):
        self.label = data.get('label', self.label)
        self.summary = data.get('summary', self.summary)
        self.summary = data.get('summary', self.summary)
        self.publisher = data.get('publisher', self.publisher)
        self.publisher_url = data.get('publisher_url', self.publisher_url)
        self.info_url = data.get('info_url', self.info_url)
        self.data_url = data.get('data_url', self.data_url)
        self.category = data.get('category') or self.DEFAULT
        self.casefile = as_bool(data.get('casefile'), default=False)
        self.countries = data.get('countries', [])
        self.languages = data.get('languages', [])
        if creator is None:
            creator = Role.by_id(data.get('creator_id'))
        self.creator = creator
        self.updated_at = datetime.utcnow()
        db.session.add(self)
        db.session.flush()
        if creator is not None:
            Permission.grant(self, creator, True, True)

    @property
    def roles(self):
        if not hasattr(self, '_roles'):
            q = db.session.query(Permission.role_id)
            q = q.filter(Permission.deleted_at == None)  # noqa
            q = q.filter(Permission.collection_id == self.id)  # noqa
            q = q.filter(Permission.read == True)  # noqa
            self._roles = [e.role_id for e in q.all()]
        return self._roles

    @property
    def kind(self):
        return 'casefile' if self.casefile else 'source'

    @classmethod
    def by_foreign_id(cls, foreign_id, deleted=False):
        if foreign_id is None:
            return
        q = cls.all(deleted=deleted)
        return q.filter(cls.foreign_id == foreign_id).first()

    @classmethod
    def all_by_ids(cls, ids, deleted=False, authz=None):
        q = super(Collection, cls).all_by_ids(ids, deleted=deleted)
        if authz is not None and not authz.is_admin:
            q = q.join(Permission, cls.id == Permission.collection_id)
            q = q.filter(Permission.deleted_at == None)  # noqa
            q = q.filter(Permission.read == True)  # noqa
            q = q.filter(Permission.role_id.in_(authz.roles))
        return q

    @classmethod
    def create(cls, data, role=None):
        foreign_id = data.get('foreign_id') or make_textid()
        collection = cls.by_foreign_id(foreign_id, deleted=True)
        if collection is None:
            collection = cls()
            collection.foreign_id = foreign_id
        collection.update(data, creator=role)
        collection.deleted_at = None
        return collection

    def __repr__(self):
        return '<Collection(%r, %r, %r)>' % \
            (self.id, self.foreign_id, self.label)
