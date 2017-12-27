import logging
from flask_mail import Message
from flask import render_template

from aleph.core import settings, app_ui_url, mail

log = logging.getLogger(__name__)


def notify_role(role, subject, html):
    """Send an email to a user with a given address."""
    if role.email is None:
        log.info("Role %r not have email, skip notify.", role)
        return
    else:
        log.info('Notify %r with:\n %r', role, html)

    sender = '%s <%s>' % (settings.APP_TITLE, settings.MAIL_FROM)
    subject = '[%s] %s' % (settings.APP_TITLE, subject)
    msg = Message(subject=subject,
                  sender=sender,
                  recipients=[role.email])
    msg.html = html
    mail.send(msg)


def notify_role_template(role, subject, template, **kwargs):
    """Render an HTML template as you send an email."""
    try:
        html = render_template(template,
                               role=role,
                               ui_url=app_ui_url,
                               app_title=settings.APP_TITLE,
                               **kwargs)
        notify_role(role, subject, html)
    except Exception as ex:
        log.exception(ex)
