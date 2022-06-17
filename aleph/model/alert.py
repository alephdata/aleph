# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from datetime import datetime
from normality import stringify

from aleph.core import db
from aleph.model.role import Role
from aleph.model.common import DatedModel


class Alert(db.Model, DatedModel):
    """A subscription to notifications on a given query."""

    __tablename__ = "alert"

    id = db.Column(db.Integer, primary_key=True)
    query = db.Column(db.Unicode, nullable=True)
    notified_at = db.Column(db.DateTime, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey("role.id"), index=True)
    role = db.relationship(Role, backref=db.backref("alerts", lazy="dynamic"))  # noqa

    def update(self):
        self.notified_at = datetime.utcnow()
        self.updated_at = self.notified_at
        db.session.add(self)
        db.session.flush()

    def to_dict(self):
        data = self.to_dict_dates()
        data.update(
            {
                "id": stringify(self.id),
                "query": self.query,
                "role_id": stringify(self.role_id),
                "notified_at": self.notified_at,
            }
        )
        return data

    @classmethod
    def by_id(cls, id, role_id=None):
        q = cls.all().filter_by(id=id)
        if role_id is not None:
            q = q.filter(cls.role_id == role_id)
        return q.first()

    @classmethod
    def by_role_id(cls, role_id):
        q = cls.all()
        q = q.filter(cls.role_id == role_id)
        q = q.order_by(cls.created_at.desc())
        q = q.order_by(cls.id.desc())
        return q

    @classmethod
    def create(cls, data, role_id):
        alert = cls()
        alert.role_id = role_id
        alert.query = stringify(data.get("query"))
        alert.update()
        return alert

    def __repr__(self):
        return "<Alert(%r, %r)>" % (self.id, self.query)
