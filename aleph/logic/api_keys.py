import datetime
from flask import render_template

from aleph.core import db
from aleph.model.common import make_token
from aleph.logic.mail import email_role
from aleph.logic.roles import update_role

# Number of days after which API keys expire
API_KEY_EXPIRATION_DAYS = 90


def generate_user_api_key(role):
    event = "regenerated" if role.has_api_key else "generated"
    params = {"role": role, "event": event}
    plain = render_template("email/api_key_generated.txt", **params)
    html = render_template("email/api_key_generated.html", **params)
    subject = f"API key {event}"
    email_role(role, subject, html=html, plain=plain)

    now = datetime.datetime.utcnow()
    role.api_key = make_token()
    role.api_key_expires_at = now + datetime.timedelta(days=API_KEY_EXPIRATION_DAYS)

    db.session.add(role)
    db.session.commit()
    update_role(role)

    return role.api_key
