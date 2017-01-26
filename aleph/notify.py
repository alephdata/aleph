import logging
from flask_mail import Message

from aleph.core import get_config, app_title, mail

log = logging.getLogger(__name__)


def notify_role(role, subject, html):
    """Send an email to a user with a given address."""
    if role.email is None:
        log.info("Role %r not have email, skip notify.", role)
        return
    else:
        log.info('Notify %r with:\n %r', role, html)

    sender = '%s <%s>' % (app_title, get_config('MAIL_FROM'))
    subject = '[%s] %s' % (app_title, subject)
    msg = Message(subject=subject,
                  sender=sender,
                  recipients=[role.email])
    msg.html = html
    mail.send(msg)
