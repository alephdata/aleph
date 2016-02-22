import logging
from flask_mail import Message

from aleph.core import app, mail

log = logging.getLogger(__name__)


def notify_role(role, subject, html):
    if role.email is None:
        log.error("Role does not have E-Mail: %r", role)
        return

    sender = '%s <%s>' % (app.config.get('APP_TITLE'),
                          app.config.get('MAIL_FROM'))
    subject = '[%s] %s' % (app.config.get('APP_TITLE'), subject)
    msg = Message(subject=subject,
                  sender=sender,
                  recipients=[role.email])
    msg.html = html
    mail.send(msg)
