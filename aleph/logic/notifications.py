import logging
from banal import ensure_list
from datetime import datetime, timedelta
from followthemoney.util import get_entity_id

from aleph.core import db
from aleph.model import Role, Alert, Event, Notification
from aleph.model import Collection, Document, Entity
from aleph.logic.util import collection_url, entity_url, ui_url
from aleph.index.entities import get_entity
from aleph.index.collections import get_collection
from aleph.notify import notify_role
from aleph.util import html_link

log = logging.getLogger(__name__)


def resolve_id(object_id, clazz):
    """From an object ID and class type, generate a human-readable
    label and a link that can be rendered into the notification.
    """
    from aleph.logic.roles import get_role
    from aleph.logic.alerts import get_alert
    if clazz == Role:
        role = get_role(object_id)
        if role is not None:
            return role.get('name'), None
    elif clazz == Alert:
        alert = get_alert(object_id)
        if alert is not None:
            return alert.get('query'), None
    elif clazz == Collection:
        collection = get_collection(object_id)
        if collection is not None:
            return collection.get('label'), collection_url(object_id)
    elif clazz in [Document, Entity]:
        entity = get_entity(object_id)
        if entity is not None:
            return entity.get('name'), entity_url(object_id)
    return None, None


def channel(obj, clazz=None):
    clazz = clazz or type(obj)
    if clazz == str:
        return obj

    obj = get_entity_id(obj)
    if obj is not None:
        return '%s:%s' % (clazz.__name__, obj)


def publish(event, actor_id=None, params=None, channels=None):
    """ Publish a notification to the given channels, while storing
    the parameters and initiating actor for the event. """
    assert isinstance(event, Event), event
    params = params or {}
    outparams = {}
    channels = ensure_list(channels)
    channels.append(channel(actor_id, clazz=Role))
    for name, clazz in event.params.items():
        obj = params.get(name)
        outparams[name] = get_entity_id(obj)
        channels.append(channel(obj, clazz=clazz))
    Notification.publish(event,
                         actor_id=actor_id,
                         params=outparams,
                         channels=channels)
    db.session.flush()


def flush_notifications(obj, clazz=None):
    channel_ = channel(obj, clazz=clazz)
    Notification.delete_by_channel(channel_)


def render_notification(notification):
    """ Generate a text version of the notification, suitable for use
    in an email or text message. """
    message = str(notification.event.template)
    for name, clazz, value in notification.iterparams():
        template = '{{%s}}' % name
        text = html_link(*resolve_id(value, clazz))
        message = message.replace(template, text)
    return message


def generate_digest():
    """Generate notification digest emails for all users."""
    for role in Role.all_users(has_email=True):
        generate_role_digest(role)


def generate_role_digest(role):
    """Generate notification digest emails for the given user."""
    # TODO: get and use the role's locale preference.
    since = datetime.utcnow() - timedelta(hours=25)
    q = Notification.by_role(role, since=since)
    total_count = q.count()
    if total_count == 0:
        return
    notifications = []
    for notification in q.limit(25):
        notifications.append(render_notification(notification))

    subject = '%s notifications' % total_count
    notify_role(role, subject,
                'email/notifications.html',
                total_count=total_count,
                notifications=notifications,
                manage_url=ui_url('notifications'))
