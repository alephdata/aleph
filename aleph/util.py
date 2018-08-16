# coding: utf-8
import time
import random
import logging
from celery import Task
from banal import ensure_list
from normality import stringify
from pkg_resources import iter_entry_points

log = logging.getLogger(__name__)
EXTENSIONS = {}


def get_extensions(section):
    if section not in EXTENSIONS:
        EXTENSIONS[section] = {}
    if not EXTENSIONS[section]:
        for ep in iter_entry_points(section):
            EXTENSIONS[section][ep.name] = ep.load()
    return list(EXTENSIONS[section].values())


def dict_list(data, *keys):
    """Get an entry as a list from a dict. Provide a fallback key."""
    for key in keys:
        if key in data:
            return ensure_list(data[key])
    return []


def backoff(failures=0):
    # sleep = 2 ** (failures + 1)
    if failures == 0:
        return
    sleep = random.random() * failures
    log.debug("Back-off: %.2f sec.", sleep)
    time.sleep(sleep)


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


class SessionTask(Task):

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        from aleph.core import db
        db.session.remove()
