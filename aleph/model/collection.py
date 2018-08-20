import logging
from banal import as_bool, ensure_list
from datetime import datetime
from flask.ext.babel import lazy_gettext
from sqlalchemy.orm import aliased
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
    # TODO: should this be configurable?
    CATEGORIES = {
        'news': lazy_gettext('News archives'),
        'leak': lazy_gettext('Leaks'),
        'land': lazy_gettext('Land registry'),
        'gazette': lazy_gettext('Gazettes'),
        'court': lazy_gettext('Court archives'),
        'company': lazy_gettext('Company registries'),
        'sanctions': lazy_gettext('Sanctions lists'),
        'procurement': lazy_gettext('Procurement'),
        'grey': lazy_gettext('Grey literature'),
        'library': lazy_gettext('Document libraries'),
        'license': lazy_gettext('Licenses and concessions'),
        'regulatory': lazy_gettext('Regulatory filings'),
        'poi': lazy_gettext('Persons of interest'),
        'customs': lazy_gettext('Customs declarations'),
        'census': lazy_gettext('Population census'),
        'transport': lazy_gettext('Air and maritime registers'),
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
        self.updated_at = datetime.utcnow()
        self.label = data.get('label', self.label)
        self.summary = data.get('summary', self.summary)
        self.summary = data.get('summary', self.summary)
        self.publisher = data.get('publisher', self.publisher)
        self.publisher_url = data.get('publisher_url', self.publisher_url)
        self.info_url = data.get('info_url', self.info_url)
        self.data_url = data.get('data_url', self.data_url)
        self.category = data.get('category', self.category)
        self.casefile = as_bool(data.get('casefile'), default=self.casefile)
        self.countries = ensure_list(data.get('countries', self.countries))
        self.languages = ensure_list(data.get('languages', self.languages))
        if creator is None:
            creator = Role.by_id(data.get('creator_id'))
        if creator is not None:
            self.creator = creator
        db.session.add(self)
        db.session.flush()
        self.reset_state()
        if self.creator is not None:
            Permission.grant(self, self.creator, True, True)

    def reset_state(self):
        if hasattr(self, '_roles'):
            self._roles = None

    @property
    def roles(self):
        if not hasattr(self, '_roles') or self._roles is None:
            q = db.session.query(Permission.role_id)
            q = q.filter(Permission.deleted_at == None)  # noqa
            q = q.filter(Permission.collection_id == self.id)  # noqa
            q = q.filter(Permission.read == True)  # noqa
            self._roles = [e.role_id for e in q.all()]
        return self._roles

    @property
    def team(self):
        role = aliased(Role)
        perm = aliased(Permission)
        q = db.session.query(role)
        q = q.filter(role.type != Role.SYSTEM)
        q = q.filter(role.id == perm.role_id)
        q = q.filter(perm.collection_id == self.id)
        q = q.filter(perm.read == True)  # noqa
        q = q.filter(role.deleted_at == None)  # noqa
        q = q.filter(perm.deleted_at == None)  # noqa
        return q

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
    def _apply_authz(cls, q, authz):
        if authz is not None and not authz.is_admin:
            q = q.join(Permission, cls.id == Permission.collection_id)
            q = q.filter(Permission.deleted_at == None)  # noqa
            q = q.filter(Permission.read == True)  # noqa
            q = q.filter(Permission.role_id.in_(authz.roles))
        return q

    @classmethod
    def all_authz(cls, authz, deleted=False):
        q = super(Collection, cls).all(deleted=deleted)
        return cls._apply_authz(q, authz)

    @classmethod
    def all_by_ids(cls, ids, deleted=False, authz=None):
        q = super(Collection, cls).all_by_ids(ids, deleted=deleted)
        return cls._apply_authz(q, authz)

    @classmethod
    def create(cls, data, role=None, created_at=None):
        foreign_id = data.get('foreign_id') or make_textid()
        collection = cls.by_foreign_id(foreign_id, deleted=True)
        if collection is None:
            collection = cls()
            collection.created_at = created_at
            collection.foreign_id = foreign_id
            collection.category = cls.DEFAULT
            collection.casefile = False
        collection.update(data, creator=role)
        collection.deleted_at = None
        return collection

    def __repr__(self):
        return '<Collection(%r, %r, %r)>' % \
            (self.id, self.foreign_id, self.label)
