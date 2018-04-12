import six
import logging
import requests
from banal import ensure_list

from aleph.core import db, settings
from aleph.model import Role, Event, Notification

log = logging.getLogger(__name__)


def object_id(obj, clazz=None):
    clazz = clazz or type(obj)
    if isinstance(obj, clazz):
        obj = obj.id
    elif isinstance(obj, dict):
        obj = obj.get('id')
    return obj


def channel(obj, clazz=None):
    clazz = clazz or type(obj)
    if clazz in six.string_types:
        return obj

    obj = object_id(obj, clazz=clazz)
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
        outparams[name] = object_id(obj, clazz=clazz)
        channels.append(channel(obj, clazz=clazz))
    notification = Notification.publish(event,
                                        actor_id=actor_id,
                                        params=outparams,
                                        channels=channels)
    db.session.flush()
    ldn_publish(notification)


def ldn_publish(notification):
    """Emit Linked Data Notifications (LDN) based on the given
    notification. This checks which subscriptions match the channels
    on which the notification is broadcast, and posts messages to an
    LDN inbox."""
    if settings.LDN_RECEIVER_URI is None:
        log.debug("Linked data notifications (LDN) not configured.")
        return

    text = render_text(notification)
    timestamp = notification.created_at.strftime("%Y-%m-%d %H:%M:%S")
    for role in notification.recipients:
        message = {
            "@context": {"schema": "http://schema.org#"},
            "@id": notification.id,
            "schema:email": role.email,
            "schema:link": "http://data.blubb",
            "schema:producer": six.text_type(settings.APP_TITLE),
            "schema:subjectOf": text,
            "schema:text": text,
            "schema:timestamp": timestamp
        }
        headers = {
            'Content-Type': 'application/ld+json',
            'Access-Token': settings.LDN_ACCESS_TOKEN
        }
        res = requests.post(settings.LDN_RECEIVER_URI,
                            json=message,
                            headers=headers)
        print res.json()


def render_text(notification):
    """ Generate a text version of the notification, suitable for use
    in an email or text message. """
    return 'banana'
