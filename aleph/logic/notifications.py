import six
import logging
import requests
from banal import ensure_list

from aleph.core import db, settings
from aleph.model import Role, Alert, Event, Notification
from aleph.model import Collection, Document, Entity
from aleph.index.entities import get_entity
from aleph.logic.util import collection_url, entity_url, document_url
from aleph.logic.util import ui_url, quoted

log = logging.getLogger(__name__)


def object_id(obj, clazz=None):
    """Turn a given object into an ID that can be stored in with
    the notification."""
    clazz = clazz or type(obj)
    if isinstance(obj, clazz):
        obj = obj.id
    elif isinstance(obj, dict):
        obj = obj.get('id')
    return obj


def resolve_id(object_id, clazz):
    """From an object ID and class type, generate a human-readable
    label and a link that can be rendered into the notification.
    """
    text, link = None, None
    if clazz == Role:
        role = Role.by_id(object_id)
        text = quoted(role.name if role is not None else None)
    elif clazz == Alert:
        alert = Alert.by_id(object_id)
        text = quoted(alert.label if alert is not None else None)
    elif clazz == Collection:
        collection = Collection.by_id(object_id)
        if collection is not None:
            text = quoted(collection.label)
            link = collection_url(object_id)
    elif clazz in [Document, Entity]:
        entity = get_entity(object_id)
        if entity is not None:
            if Document.SCHEMA in entity.get('schemata'):
                text = quoted(entity.get('title', entity.get('file_name')))
                link = document_url(object_id)
            else:
                text = quoted(entity.get('name'))
                link = entity_url(object_id)
    return text, link


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

    # TODO: send this into the queue.
    ldn_publish(notification)


def ldn_publish(notification):
    """Emit Linked Data Notifications (LDN) based on the given
    notification. This checks which subscriptions match the channels
    on which the notification is broadcast, and posts messages to an
    LDN inbox."""
    if settings.LDN_RECEIVER_URI is None:
        log.debug("Linked data notifications (LDN) not configured.")
        return

    text, link = render_notification(notification)
    timestamp = notification.created_at.strftime("%Y-%m-%d %H:%M:%S")
    for role in notification.recipients:
        message = {
            "@context": {"schema": "http://schema.org#"},
            "@id": notification.id,
            "schema:email": role.email,
            "schema:producer": "aleph",  # six.text_type(settings.APP_TITLE),
            "schema:text": text,
            "schema:subjectOf": text,
            "schema:link": link,
            "schema:timestamp": timestamp
        }
        headers = {
            'Content-Type': 'application/ld+json',
            'Access-Token': settings.LDN_ACCESS_TOKEN
        }
        res = requests.post(settings.LDN_RECEIVER_URI,
                            json=message,
                            headers=headers)
        print res


def render_notification(notification):
    """ Generate a text version of the notification, suitable for use
    in an email or text message. """
    # TODO: get and use the role's locale preference.
    link = ui_url('notificiation')
    message = six.text_type(notification.event.template)
    for name, clazz, value in notification.iterparams():
        template = '{{%s}}' % name
        text, plink = resolve_id(value, clazz)
        if name == notification.event.link and plink is not None:
            link = plink
        text = text or '(unknown)'
        message = message.replace(template, text)
    return message, link
