import logging
from flask_mail import Message

from aleph.core import get_config, mail

log = logging.getLogger(__name__)


def notify_role(role, subject, html):
    if role.email is None:
        log.error("Role does not have E-Mail: %r", role)
        return

    sender = '%s <%s>' % (get_config('APP_TITLE'),
                          get_config('MAIL_FROM'))
    subject = '[%s] %s' % (get_config('APP_TITLE'), subject)
    msg = Message(subject=subject,
                  sender=sender,
                  recipients=[role.email])
    msg.html = html
    mail.send(msg)
