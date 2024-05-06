import datetime

from flask import render_template
from sqlalchemy import and_, or_, func

from aleph.core import db
from aleph.model import Role
from aleph.model.common import make_token
from aleph.logic.mail import email_role
from aleph.logic.roles import update_role
from aleph.logic.util import ui_url

# Number of days after which API keys expire
API_KEY_EXPIRATION_DAYS = 90

# Number of days before an API key expires
API_KEY_EXPIRES_SOON_DAYS = 7


def generate_user_api_key(role):
    event = "regenerated" if role.has_api_key else "generated"
    params = {"role": role, "event": event}
    plain = render_template("email/api_key_generated.txt", **params)
    html = render_template("email/api_key_generated.html", **params)
    subject = f"API key {event}"
    email_role(role, subject, html=html, plain=plain)

    now = datetime.datetime.utcnow().replace(microsecond=0)
    role.api_key = make_token()
    role.api_key_expires_at = now + datetime.timedelta(days=API_KEY_EXPIRATION_DAYS)
    role.api_key_expiration_notification_sent = None

    db.session.add(role)
    db.session.commit()
    update_role(role)

    return role.api_key


def send_api_key_expiration_notifications():
    _send_api_key_expiration_notification(
        days=7,
        subject="Your API key will expire in 7 days",
        plain_template="email/api_key_expires_soon.txt",
        html_template="email/api_key_expires_soon.html",
    )

    _send_api_key_expiration_notification(
        days=0,
        subject="Your API key has expired",
        plain_template="email/api_key_expired.txt",
        html_template="email/api_key_expired.html",
    )


def _send_api_key_expiration_notification(
    days,
    subject,
    plain_template,
    html_template,
):
    now = datetime.date.today()
    threshold = now + datetime.timedelta(days=days)

    query = Role.all_users()
    query = query.yield_per(1000)
    query = query.where(
        and_(
            and_(
                Role.api_key != None,  # noqa: E711
                func.date(Role.api_key_expires_at) <= threshold,
            ),
            or_(
                Role.api_key_expiration_notification_sent == None,  # noqa: E711
                Role.api_key_expiration_notification_sent > days,
            ),
        )
    )

    for role in query:
        params = {
            "role": role,
            "expires_at": role.api_key_expires_at,
            "settings_url": ui_url("settings"),
        }
        plain = render_template(plain_template, **params)
        html = render_template(html_template, **params)
        email_role(role, subject, html=html, plain=plain)

    query.update({Role.api_key_expiration_notification_sent: days})
    db.session.commit()


def reset_api_key_expiration():
    now = datetime.datetime.utcnow().replace(microsecond=0)
    expires_at = now + datetime.timedelta(days=API_KEY_EXPIRATION_DAYS)

    query = Role.all_users()
    query = query.yield_per(500)
    query = query.where(
        and_(
            Role.api_key != None,  # noqa: E711
            Role.api_key_expires_at == None,  # noqa: E711
        )
    )

    query.update({Role.api_key_expires_at: expires_at})
    db.session.commit()
