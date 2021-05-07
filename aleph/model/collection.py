import logging
from datetime import datetime
from normality import stringify
from flask_babel import lazy_gettext
from sqlalchemy.orm import aliased
from banal import ensure_list, ensure_dict
from sqlalchemy.dialects.postgresql import ARRAY
from followthemoney.namespace import Namespace
from followthemoney.types import registry

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
        "news": lazy_gettext("News archives"),
        "leak": lazy_gettext("Leaks"),
        "land": lazy_gettext("Land registry"),
        "gazette": lazy_gettext("Gazettes"),
        "court": lazy_gettext("Court archives"),
        "company": lazy_gettext("Company registries"),
        "sanctions": lazy_gettext("Sanctions lists"),
        "procurement": lazy_gettext("Procurement"),
        "finance": lazy_gettext("Financial records"),
        "grey": lazy_gettext("Grey literature"),
        "library": lazy_gettext("Document libraries"),
        "license": lazy_gettext("Licenses and concessions"),
        "regulatory": lazy_gettext("Regulatory filings"),
        "poi": lazy_gettext("Persons of interest"),
        "customs": lazy_gettext("Customs declarations"),
        "census": lazy_gettext("Population census"),
        "transport": lazy_gettext("Air and maritime registers"),
        "casefile": lazy_gettext("Investigations"),
        "other": lazy_gettext("Other material"),
    }
    CASEFILE = "casefile"

    # How often a collection is updated:
    FREQUENCIES = {
        "unknown": lazy_gettext("not known"),
        "never": lazy_gettext("not updated"),
        "daily": lazy_gettext("daily"),
        "weekly": lazy_gettext("weekly"),
        "monthly": lazy_gettext("monthly"),
        "annual": lazy_gettext("annual"),
    }
    DEFAULT_FREQUENCY = "unknown"

    label = db.Column(db.Unicode)
    summary = db.Column(db.Unicode, nullable=True)
    category = db.Column(db.Unicode, nullable=True)
    frequency = db.Column(db.Unicode, nullable=True)
    countries = db.Column(ARRAY(db.Unicode()), default=[])
    languages = db.Column(ARRAY(db.Unicode()), default=[])
    foreign_id = db.Column(db.Unicode, unique=True, nullable=False)
    publisher = db.Column(db.Unicode, nullable=True)
    publisher_url = db.Column(db.Unicode, nullable=True)
    info_url = db.Column(db.Unicode, nullable=True)
    data_url = db.Column(db.Unicode, nullable=True)

    # Collection inherits the `updated_at` column from `DatedModel`.
    # These two fields are used to express different semantics: while
    # `updated_at` is used to describe the last change of the metadata,
    # `data_updated_at` keeps application-level information on the last
    # change to the data within this collection.
    data_updated_at = db.Column(db.DateTime, nullable=True)

    # This collection is marked as super-secret:
    restricted = db.Column(db.Boolean, default=False)

    # Run xref on entity changes:
    xref = db.Column(db.Boolean, default=False)

    creator_id = db.Column(db.Integer, db.ForeignKey("role.id"), nullable=True)
    creator = db.relationship(Role)

    def touch(self):
        # https://www.youtube.com/watch?v=wv-34w8kGPM
        self.data_updated_at = datetime.utcnow()
        db.session.add(self)

    def update(self, data, authz):
        self.label = data.get("label", self.label)
        self.summary = data.get("summary", self.summary)
        self.publisher = data.get("publisher", self.publisher)
        self.publisher_url = data.get("publisher_url", self.publisher_url)
        if self.publisher_url is not None:
            self.publisher_url = stringify(self.publisher_url)
        self.info_url = data.get("info_url", self.info_url)
        if self.info_url is not None:
            self.info_url = stringify(self.info_url)
        self.data_url = data.get("data_url", self.data_url)
        if self.data_url is not None:
            self.data_url = stringify(self.data_url)
        countries = ensure_list(data.get("countries", self.countries))
        self.countries = [registry.country.clean(val) for val in countries]
        languages = ensure_list(data.get("languages", self.languages))
        self.languages = [registry.language.clean(val) for val in languages]
        self.frequency = data.get("frequency", self.frequency)
        self.restricted = data.get("restricted", self.restricted)
        self.xref = data.get("xref", self.xref)
        self.updated_at = datetime.utcnow()

        # Some fields are editable only by admins in order to have
        # a strict separation between source evidence and case
        # material.
        if authz.is_admin:
            self.category = data.get("category", self.category)
            creator = ensure_dict(data.get("creator"))
            creator_id = data.get("creator_id", creator.get("id"))
            creator = Role.by_id(creator_id)
            if creator is not None:
                self.creator = creator

        db.session.add(self)
        db.session.flush()

    @property
    def team_id(self):
        role = aliased(Role)
        perm = aliased(Permission)
        q = db.session.query(role.id)
        q = q.filter(role.type != Role.SYSTEM)
        q = q.filter(role.id == perm.role_id)
        q = q.filter(perm.collection_id == self.id)
        q = q.filter(perm.read == True)  # noqa
        q = q.filter(role.deleted_at == None)  # noqa
        return [stringify(i) for (i,) in q.all()]

    @property
    def secret(self):
        q = db.session.query(Permission.id)
        q = q.filter(Permission.role_id.in_(Role.public_roles()))
        q = q.filter(Permission.collection_id == self.id)
        q = q.filter(Permission.read == True)  # noqa
        return q.count() < 1

    @property
    def casefile(self):
        # A casefile is a type of collection which is used to manage the state
        # of an investigation. Unlike normal collections, cases do not serve
        # as source material, but as a mechanism of analysis.
        return self.category == self.CASEFILE

    @property
    def ns(self):
        if not hasattr(self, "_ns"):
            self._ns = Namespace(self.foreign_id)
        return self._ns

    def to_dict(self):
        data = self.to_dict_dates()
        data["category"] = self.CASEFILE
        if self.category in self.CATEGORIES:
            data["category"] = self.category
        data["frequency"] = self.DEFAULT_FREQUENCY
        if self.frequency in self.FREQUENCIES:
            data["frequency"] = self.frequency
        countries = ensure_list(self.countries)
        countries = [registry.country.clean(c) for c in countries]
        data["countries"] = [c for c in countries if c is not None]
        languages = ensure_list(self.languages)
        languages = [registry.language.clean(c) for c in languages]
        data["languages"] = [c for c in languages if c is not None]
        data.update(
            {
                "id": stringify(self.id),
                "collection_id": stringify(self.id),
                "foreign_id": self.foreign_id,
                "creator_id": stringify(self.creator_id),
                "data_updated_at": self.data_updated_at,
                "team_id": self.team_id,
                "label": self.label,
                "summary": self.summary,
                "publisher": self.publisher,
                "publisher_url": self.publisher_url,
                "info_url": self.info_url,
                "data_url": self.data_url,
                "casefile": self.casefile,
                "secret": self.secret,
                "xref": self.xref,
                "restricted": self.restricted,
            }
        )
        return data

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
            q = q.filter(Permission.read == True)  # noqa
            q = q.filter(Permission.role_id.in_(authz.roles))
        return q

    @classmethod
    def all_authz(cls, authz, deleted=False):
        q = super(Collection, cls).all(deleted=deleted)
        return cls._apply_authz(q, authz)

    @classmethod
    def all_casefiles(cls, authz=None):
        q = super(Collection, cls).all()
        q = q.filter(Collection.category == cls.CASEFILE)
        return cls._apply_authz(q, authz)

    @classmethod
    def all_by_ids(cls, ids, deleted=False, authz=None):
        q = super(Collection, cls).all_by_ids(ids, deleted=deleted)
        return cls._apply_authz(q, authz)

    @classmethod
    def all_by_secret(cls, secret, authz=None):
        q = super(Collection, cls).all()
        if secret is not None:
            q = q.filter(Collection.restricted == secret)
        return cls._apply_authz(q, authz)

    @classmethod
    def create(cls, data, authz, created_at=None):
        foreign_id = data.get("foreign_id") or make_textid()
        collection = cls.by_foreign_id(foreign_id, deleted=True)
        if collection is None:
            collection = cls()
            collection.created_at = created_at
            collection.foreign_id = foreign_id
            collection.category = cls.CASEFILE
            collection.creator = authz.role
        collection.deleted_at = None
        collection.data_updated_at = None
        collection.update(data, authz)
        db.session.flush()
        if collection.creator is not None:
            Permission.grant(collection, collection.creator, True, True)
        return collection

    def __repr__(self):
        fmt = "<Collection(%r, %r, %r)>"
        return fmt % (self.id, self.foreign_id, self.label)

    def __str__(self):
        return self.foreign_id
