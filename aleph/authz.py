from flask import request
from flask.ext.login import current_user
from werkzeug.exceptions import Forbidden


def request_collections(action):
    try:
        return request.collection_slugs.get(action) or []
    except:
        return []


def collection_read(name):
    return name in request_collections('read')


def collection_write(name):
    return name in request_collections('write')


def logged_in():
    return current_user.is_authenticated()


def require(pred):
    if not pred:
        raise Forbidden("Sorry, you're not permitted to do this!")
