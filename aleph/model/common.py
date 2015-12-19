import os
import uuid
import string
from datetime import datetime

from normality import slugify
from sqlalchemy import func

from aleph.core import db


ALPHABET = string.ascii_lowercase + string.digits


def db_norm(col):
    return func.trim(func.lower(col))


def db_compare(col, text):
    if text is None:
        return col == text
    text_ = text.lower().strip()
    return db_norm(col) == text_


def make_token():
    num = uuid.uuid4().int
    s = []
    while True:
        num, r = divmod(num, len(ALPHABET))
        s.append(ALPHABET[r])
        if num == 0:
            break
    return ''.join(reversed(s))


def make_textid():
    return uuid.uuid4().hex


def make_filename(source):
    if source is not None and len(source):
        source = os.path.basename(source)
        source, ext = os.path.splitext(source)
        source = slugify(source)
        ext = ext.lower().strip().replace('.', '')
        if len(ext):
            source = '%s.%s' % (source, ext)
    return source


# def fullpath(filename):
#     """ Perform normalization of the source file name. """
#     if filename is None:
#         return
#     # a happy tour through stdlib
#     filename = os.path.expanduser(filename)
#     filename = os.path.expandvars(filename)
#     filename = os.path.normpath(filename)
#     return os.path.abspath(filename)


class TimeStampedModel(object):
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
