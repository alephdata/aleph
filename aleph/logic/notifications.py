import six
from banal import ensure_list

from aleph.model import Role, Events, Notification


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
    if not isinstance(event, dict):
        event = Events.get(event)
    assert event is not None, event
    params = params or {}
    channels = ensure_list(channels)
    channels.append(channel(actor_id, clazz=Role))
    for name, clazz in event.get('params', {}).items():
        obj = params.get(name)
        params[name] = object_id(obj, clazz=clazz)
        channels.append(channel(obj, clazz=clazz))
    Notification.publish(event.get('name'),
                         actor_id=actor_id,
                         params=params,
                         channels=channels)
