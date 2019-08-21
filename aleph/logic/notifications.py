import logging
from banal import ensure_list
from flask import render_template
from datetime import datetime, timedelta
from followthemoney.util import get_entity_id

from aleph.core import db, cache, settings
from aleph.authz import Authz
from aleph.mail import email_role
from aleph.model import Role, Alert, Event, Notification
from aleph.model import Collection, Entity
from aleph.logic.util import collection_url, entity_url, ui_url
from aleph.util import html_link

log = logging.getLogger(__name__)


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


def get_role_channels(role):
    """Generate the set of notification channels that the current
    user should listen to."""
    key = cache.object_key(Role, role.id, 'channels')
    channels = cache.get_list(key)
    if len(channels):
        return channels
    channels = [Notification.GLOBAL]
    if role.deleted_at is None and role.type == Role.USER:
        authz = Authz.from_role(role)
        for role_id in authz.roles:
            channels.append(channel(role_id, Role))
        for coll_id in authz.collections(authz.READ):
            channels.append(channel(coll_id, Collection))
    cache.set_list(key, channels, expire=cache.EXPIRE)
    return channels


def render_notification(stub, notification):
    """Generate a text version of the notification, suitable for use
    in an email or text message."""
    from aleph.logic import resolver
    for name, clazz, value in notification.iterparams():
        resolver.queue(stub, clazz, value)
    resolver.resolve(stub)

    plain = str(notification.event.template)
    html = str(notification.event.template)
    for name, clazz, value in notification.iterparams():
        data = resolver.get(stub, clazz, value)
        if data is None:
            return
        link, title = None, None
        if clazz == Role:
            title = data.get('label')
        elif clazz == Alert:
            title = data.get('query')
        elif clazz == Collection:
            title = data.get('label')
            link = collection_url(value)
        elif clazz == Entity:
            title = data.get('name')
            link = entity_url(value)

        template = '{{%s}}' % name
        html = html.replace(template, html_link(title, link))
        plain = plain.replace(template, "'%s'" % title)
        if name == notification.event.link_to:
            plain = '%s (%s)' % (plain, link)
    return {'plain': plain, 'html': html}


def generate_digest():
    """Generate notification digest emails for all users."""
    for role in Role.all_users(has_email=True):
        generate_role_digest(role)


def generate_role_digest(role):
    """Generate notification digest emails for the given user."""
    # TODO: get and use the role's locale preference.
    since = datetime.utcnow() - timedelta(hours=25)
    q = Notification.by_channels(get_role_channels(role),
                                 since=since, exclude_actor_id=role.id)
    total_count = q.count()
    if total_count == 0:
        return
    notifications = [render_notification(role, n) for n in q.limit(20)]
    notifications = [n for n in notifications if n is not None]
    params = dict(notifications=notifications,
                  role=role,
                  total_count=total_count,
                  manage_url=ui_url('notifications'),
                  ui_url=settings.APP_UI_URL,
                  app_title=settings.APP_TITLE)
    plain = render_template('email/notifications.txt', **params)
    html = render_template('email/notifications.html', **params)
    log.info("Notification: %s", plain)
    subject = '%s notifications' % total_count
    email_role(role, subject, html=html, plain=plain)
