# coding: utf-8
import json
import logging
from typing import Optional

from normality import stringify
from datetime import datetime, date
from flask_babel.speaklater import LazyString
from collections import abc


log = logging.getLogger(__name__)


def anonymize_email(name: str, email: Optional[str]) -> str:
    """Generate a simple label with both the name and email of a user."""
    if email is None:
        return name
    if "@" in email:
        mailbox, domain = email.rsplit("@", 1)
        if len(mailbox):
            repl = "*" * (len(mailbox) - 1)
            mailbox = mailbox[0] + repl
        email = "%s@%s" % (mailbox, domain)
    if name is None:
        return email
    return "%s <%s>" % (name, email)


class JSONEncoder(json.JSONEncoder):
    """ This encoder will serialize all entities that have a to_dict
    method by calling that method and serializing the result. """

    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, bytes):
            return obj.decode("utf-8")
        if isinstance(obj, LazyString):
            return str(obj)
        if isinstance(obj, set):
            return [o for o in obj]
        if hasattr(obj, "to_dict"):
            return obj.to_dict()
        return json.JSONEncoder.default(self, obj)


class PairwiseDict(abc.MutableMapping):
    """A dictionary which sorts it's keys so that getting key (a, b) is the same as (b, a)"""

    def __init__(self, *args, **kwargs):
        self.store = dict()
        self.update(dict(*args, **kwargs))

    def __getitem__(self, key):
        return self.store[self.__keytransform__(key)]

    def __setitem__(self, key, value):
        self.store[self.__keytransform__(key)] = value

    def __delitem__(self, key):
        del self.store[self.__keytransform__(key)]

    def __iter__(self):
        return iter(self.store)

    def __len__(self):
        return len(self.store)

    def __keytransform__(self, key):
        return tuple(sorted(key))
