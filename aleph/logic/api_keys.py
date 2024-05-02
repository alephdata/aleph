from flask import render_template

from aleph.core import db
from aleph.logic.mail import email_role
from aleph.logic.roles import update_role


def generate_user_api_key(role):
    event = "regenerated" if role.has_api_key else "generated"
    params = {"role": role, "event": event}
    plain = render_template("email/api_key_generated.txt", **params)
    html = render_template("email/api_key_generated.html", **params)
    subject = f"API key {event}"
    email_role(role, subject, html=html, plain=plain)

    role.generate_api_key()
    db.session.add(role)
    db.session.commit()
    update_role(role)

    return role.api_key
