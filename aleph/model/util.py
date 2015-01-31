import uuid
import string

from sqlalchemy import func

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
