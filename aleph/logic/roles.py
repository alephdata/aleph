import logging
from flask_babel import gettext
from flask import render_template

from aleph.core import db, cache
from aleph.settings import SETTINGS
from aleph.authz import Authz
from aleph.model import Role, Alert, Permission, EntitySet, Export
from aleph.model import Collection, Document, Entity, EntitySetItem, Mapping
from aleph.model.role import membership
from aleph.logic.mail import email_role
from aleph.logic.notifications import get_role_channels

log = logging.getLogger(__name__)


def get_role(role_id):
    if role_id is None:
        return
    key = cache.object_key(Role, role_id)
    data = cache.get_complex(key)
    if data is None:
        role = Role.by_id(role_id)
        if role is None:
            return
        data = role.to_dict()
        cache.set_complex(key, data, expires=cache.EXPIRE)
    return data


def get_deep_role(role):
    authz = Authz.from_role(role)
    alerts = Alert.by_role_id(role.id).count()
    exports = Export.by_role_id(role.id).count()
    casefiles = Collection.all_casefiles(authz=authz).count()
    entitysets = EntitySet.type_counts(authz=authz)
    return {
        "counts": {
            "alerts": alerts,
            "entitysets": entitysets,
            "casefiles": casefiles,
            "exports": exports,
        },
        "shallow": False,
    }


def challenge_role(data):
    """Given an email address, this will send out a message to allow
    the user to then register an account."""
    signature = Role.SIGNATURE.dumps(data["email"])
    url = "{}activate/{}".format(SETTINGS.APP_UI_URL, signature)
    role = Role(email=data["email"], name=data["email"])
    params = dict(
        url=url, role=role, ui_url=SETTINGS.APP_UI_URL, app_title=SETTINGS.APP_TITLE
    )
    plain = render_template("email/registration_code.txt", **params)
    html = render_template("email/registration_code.html", **params)
    log.info("Challenge: %s", plain)
    email_role(role, gettext("Registration"), html=html, plain=plain)


def create_system_roles():
    log.info("Creating system roles...")
    Role.load_or_create(Role.SYSTEM_GUEST, Role.SYSTEM, "All visitors")
    Role.load_or_create(Role.SYSTEM_USER, Role.SYSTEM, "Logged-in users")
    Role.load_cli_user()
    db.session.commit()


def create_user(email, name, password, is_admin=False):
    """Create a password-based user."""
    foreign_id = "password:{}".format(email)
    role = Role.load_or_create(
        foreign_id, Role.USER, name, email=email, is_admin=is_admin
    )
    if password is not None:
        role.set_password(password)
    db.session.add(role)
    db.session.commit()
    update_role(role)
    return role


def update_role(role):
    """Synchronize denormalised role configuration."""
    refresh_role(role)
    get_role(role.id)
    get_role_channels(role)


def update_roles():
    for role in Role.all(deleted=True):
        update_role(role)


def delete_role(role):
    """Fully delete a role from the database and transfer the
    ownership of documents and entities created by it to the
    system user."""
    # Doesn't update the search index, so they're out of sync.
    fallback = Role.load_cli_user()

    def _del(cls, col):
        pq = db.session.query(cls)
        pq = pq.filter(col == role.id)
        pq.delete(synchronize_session=False)

    def _repo(cls, col):
        pq = db.session.query(cls).filter(col == role.id)
        pq.update({col: fallback.id}, synchronize_session=False)

    _del(Alert, Alert.role_id)
    _del(Permission, Permission.role_id)
    _del(membership, membership.c.group_id)
    _del(membership, membership.c.member_id)
    _repo(Collection, Collection.creator_id)
    _repo(Document, Document.role_id)
    _repo(Entity, Entity.role_id)
    _repo(EntitySet, EntitySet.role_id)
    _repo(EntitySetItem, EntitySetItem.added_by_id)
    _repo(Mapping, Mapping.role_id)
    db.session.delete(role)
    db.session.commit()


def refresh_role(role, sync=False):
    Authz.flush_role(role)
    cache.kv.delete(
        cache.object_key(Role, role.id),
        cache.object_key(Role, role.id, "channels"),
    )


def check_visible(role, authz):
    """Users should not see group roles which they are not a part of."""
    if role is None:
        return False
    if authz.can_read_role(role.id):
        return True
    return role.type == Role.USER
