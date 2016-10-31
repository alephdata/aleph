import logging
from flask_mail import Message

from aleph.core import get_config, get_app_title, mail

log = logging.getLogger(__name__)


def notify_role(role, subject, html):
    """Send an email to a user with a given address."""
    if role.email is None:
        log.info("Role %r not have email, skip notify.", role)
        return

    sender = '%s <%s>' % (get_app_title(),
                          get_config('MAIL_FROM'))
    subject = '[%s] %s' % (get_app_title(), subject)
    msg = Message(subject=subject,
                  sender=sender,
                  recipients=[role.email])
    msg.html = html
    mail.send(msg)
