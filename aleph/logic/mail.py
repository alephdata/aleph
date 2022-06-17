# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

import logging
from flask_mail import Message

from aleph.core import settings, mail

log = logging.getLogger(__name__)


def email_role(role, subject, html=None, plain=None):
    """Send an email to a user with a given address."""
    if role.email is None:
        log.info("Role [%r]: does not have email.", role)
        return

    try:
        sender = "%s <%s>" % (settings.APP_TITLE, settings.MAIL_FROM)
        subject = "[%s] %s" % (settings.APP_TITLE, subject)
        msg = Message(subject=subject, sender=sender, recipients=[role.email])
        msg.body = plain
        msg.html = html
        mail.send(msg)
    except Exception as exc:
        log.error("Error sending email [%r]: %s", role, exc)
