# coding: utf-8
import json
import logging
from normality import stringify
from datetime import datetime, date
from flask_babel.speaklater import LazyString


log = logging.getLogger(__name__)


def html_link(text, link):
    text = text or '[untitled]'
    if link is None:
        return "<span class='reference'>%s</span>" % text
    return "<a class='reference' href='%s'>%s</a>" % (link, text)


def anonymize_email(name, email):
    """Generate a simple label with both the name and email of a user."""
    name = stringify(name)
    email = stringify(email)
    if email is None:
        return name
    if '@' in email:
        mailbox, domain = email.rsplit('@', 1)
        if len(mailbox):
            repl = '*' * (len(mailbox) - 1)
            mailbox = mailbox[0] + repl
        email = '%s@%s' % (mailbox, domain)
    if name is None:
        return email
    return '%s <%s>' % (name, email)


def filter_texts(texts):
    """Remove text strings not worth indexing for full-text search."""
    for text in texts:
        if not isinstance(text, str):
            continue
        if not len(text.strip()):
            continue
        try:
            # try to exclude numeric data from
            # spreadsheets
            float(text)
            continue
        except Exception:
            pass
        yield text


class JSONEncoder(json.JSONEncoder):
    """ This encoder will serialize all entities that have a to_dict
    method by calling that method and serializing the result. """

    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, bytes):
            return obj.decode('utf-8')
        if isinstance(obj, LazyString):
            return str(obj)
        if isinstance(obj, set):
            return [o for o in obj]
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        return json.JSONEncoder.default(self, obj)
