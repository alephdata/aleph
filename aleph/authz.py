from werkzeug.exceptions import Forbidden
from flask.ext.login import current_user


def logged_in():
    return current_user.is_authenticated()


def require(pred):
    if not pred:
        raise Forbidden("Sorry, you're not permitted to do this!")
