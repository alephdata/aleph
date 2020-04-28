import logging
from banal import ensure_list
from flask import render_template
from datetime import datetime, timedelta
from followthemoney.util import get_entity_id

from aleph.core import cache, es, settings
from aleph.authz import Authz
from aleph.mail import email_role
from aleph.model import Collection, Entity, Role, Alert, Diagram
from aleph.model import Event, Events
from aleph.logic.util import collection_url, entity_url, ui_url, diagram_url
from aleph.index.notifications import index_notification, delete_notifications
from aleph.index.notifications import notifications_index
from aleph.index.util import unpack_result
from aleph.util import html_link

log = logging.getLogger(__name__)
GLOBAL = 'Global'


def channel_tag(obj, clazz=None):
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
    channels = [channel_tag(c) for c in ensure_list(channels)]
    index_notification(event, actor_id, params, channels)


def flush_notifications(obj, clazz=None, sync=False):
    """Delete all notifications in a given channel."""
    delete_notifications(channel_tag(obj, clazz=clazz), sync=sync)


def get_role_channels(role):
    """Generate the set of notification channels that the current
    user should listen to."""
    # role is None in singel user mode
    # TODO: is this the best way to solve this?
    if role is None:
        return [GLOBAL]
    key = cache.object_key(Role, role.id, 'channels')
    channels = cache.get_list(key)
    if len(channels):
        return channels
    channels = [GLOBAL]
    if role.deleted_at is None and role.type == Role.USER:
        authz = Authz.from_role(role)
        for role_id in authz.roles:
            channels.append(channel_tag(role_id, Role))
        for coll_id in authz.collections(authz.READ):
            channels.append(channel_tag(coll_id, Collection))
    cache.set_list(key, channels, expires=3600 * 2)
    return channels


def get_notifications(role, since=None, parser=None):
    """Fetch a stream of notifications for the given role."""
    channels = get_role_channels(role)
    filters = [{'terms': {'channels': channels}}]
    if since is not None:
        filters.append({'range': {'created_at': {'gt': since}}})
    ### TODO: this is a workaround for the notifictations http/500 on in single user mode.
    ### Is this to ugly to exist?
    if role is None:
        must_not = []
    else:
        must_not = [{'term': {'actor_id': role.id}}]
    query = {
        'size': 30,
        'query': {'bool': {'filter': filters, 'must_not': must_not}},
        'sort': [{'created_at': {'order': 'desc'}}]
    }
    if parser is not None:
        query['size'] = parser.limit
        query['from'] = parser.offset
    return es.search(index=notifications_index(), body=query)


def _iter_params(data, event):
    if data.get('actor_id') is not None:
        yield 'actor', Role, data.get('actor_id')
    params = data.get('params', {})
    for name, clazz in event.params.items():
        value = params.get(name)
        if value is not None:
            yield name, clazz, value


def render_notification(stub, notification):
    """Generate a text version of the notification, suitable for use
    in an email or text message."""
    from aleph.logic import resolver
    notification = unpack_result(notification)
    event = Events.get(notification.get('event'))
    if event is None:
        return

    for name, clazz, value in _iter_params(notification, event):
        resolver.queue(stub, clazz, value)
    resolver.resolve(stub)
    plain = str(event.template)
    html = str(event.template)
    for name, clazz, value in _iter_params(notification, event):
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
        elif clazz == Diagram:
            title = data.label
            link = diagram_url(data.id)

        template = '{{%s}}' % name
        html = html.replace(template, html_link(title, link))
        plain = plain.replace(template, "'%s'" % title)
        if name == event.link_to:
            plain = '%s (%s)' % (plain, link)
    return {'plain': plain, 'html': html}


def generate_digest():
    """Generate notification digest emails for all users."""
    for role in Role.all_users():
        if role.is_alertable:
            generate_role_digest(role)


def generate_role_digest(role):
    """Generate notification digest emails for the given user."""
    # TODO: get and use the role's locale preference.
    since = datetime.utcnow() - timedelta(hours=26)
    result = get_notifications(role, since=since)
    hits = result.get('hits', {})
    total_count = hits.get('total', {}).get('value')
    log.info("Daily digest: %r (%s notifications)", role, total_count)
    if total_count == 0:
        return
    notifications = [render_notification(role, n) for n in hits.get('hits')]
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
