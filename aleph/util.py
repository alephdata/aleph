# coding: utf-8
import json
from datetime import datetime, date

import structlog
from normality import stringify
from flask_babel.speaklater import LazyString
from elasticsearch import Transport


log = structlog.get_logger(__name__)


def anonymize_email(name, email):
    """Generate a simple label with both the name and email of a user."""
    name = stringify(name)
    email = stringify(email)
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
    """This encoder will serialize all entities that have a to_dict
    method by calling that method and serializing the result."""

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


class Stub(object):
    pass


class LoggingTransport(Transport):
    def __init__(self, *args, **kwargs):
        super(LoggingTransport, self).__init__(*args, **kwargs)

    def perform_request(self, method, url, headers=None, params=None, body=None):
        result = super(LoggingTransport, self).perform_request(
            method, url, headers, params, body
        )
        payload = {
            "es_req_method": method,
            "es_url": url,
            "es_req_params": params,
            "es_req_body": body,
            "took": hasattr(result, "get") and result.get("took"),
        }
        log.info("Performed ES request", **payload)
        return result
