from aleph.model import db
from aleph.model import Role, Subscription, Notification
from aleph.logic.notifications import channel


def update_role(role):
    """Synchronize denormalised role configuration."""
    db.session.flush()
    Subscription.unsubscribe(role=role, channel=channel(role))
    for group in Role.all_groups():
        Subscription.unsubscribe(role=role, channel=channel(group))

    if role.deleted_at is None:
        Subscription.subscribe(role, channel(role))
        Subscription.subscribe(role, Notification.GLOBAL)
        for group in role.roles:
            Subscription.subscribe(role, channel(group))


def update_roles():
    q = db.session.query(Role)
    for role in q.all():
        update_role(role)


def check_visible(role, authz):
    """Users should not see group roles which they are not a part of."""
    if role is None:
        return False
    if authz.is_admin or role.id in authz.roles:
        return True
    return role.type == Role.USER


def check_editable(role, authz):
    """Check if a role can be edited by the current user."""
    if authz.is_admin:
        return True
    return role.id == authz.id
