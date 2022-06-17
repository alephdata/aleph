# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

import json
import structlog
from aleph import settings
from datetime import datetime, date
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


def _get_logging_context():
    """Get the current logging context"""
    return structlog.contextvars.merge_contextvars(None, None, {})


class LoggingTransport(Transport):
    def __init__(self, *args, **kwargs):
        super(LoggingTransport, self).__init__(*args, **kwargs)

    def perform_request(self, method, url, headers=None, params=None, body=None):
        if headers is None:
            headers = {}
        ctx = _get_logging_context()
        trace_id = ctx.get("trace_id")
        if trace_id is not None:
            # link es tasks to a trace id
            headers["x-opaque-id"] = trace_id

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
        # Don't log the request body when writing entities to the index
        # to prevent unnecessarily large logs
        if url.endswith("_bulk"):
            del payload["es_req_body"]
        log.debug("Performed ES request", **payload)
        return result

def is_auto_admin(email):
    auto_admins = [a.lower() for a in settings.ADMINS]
    return email is not None and email.lower() in auto_admins
