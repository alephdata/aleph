import logging
from logging.handlers import SMTPHandler
from flask import Flask
from flask import url_for as flask_url_for
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.assets import Environment
from flask.ext.migrate import Migrate
from flask_oauthlib.client import OAuth
from flask_mail import Mail
from kombu import Exchange, Queue
from celery import Celery
from elasticsearch import Elasticsearch

from aleph import default_settings, archive


app = Flask(__name__)
app.config.from_object(default_settings)
app.config.from_envvar('ALEPH_SETTINGS', silent=True)

app_name = app.config.get('APP_NAME')
app_url = app.config.get('APP_URL')

oauth = OAuth(app)
oauth_provider = oauth.remote_app('provider', app_key='OAUTH')

mail = Mail(app)

db = SQLAlchemy(app)
migrate = Migrate(app, db, directory=app.config.get('ALEMBIC_DIR'))

es = Elasticsearch(app.config.get('ELASTICSEARCH_URL'), timeout=120)
es_index = app.config.get('ELASTICSEARCH_INDEX', app_name)

queue_name = app_name + '_q'
app.config['CELERY_DEFAULT_QUEUE'] = queue_name
app.config['CELERY_QUEUES'] = (
    Queue(queue_name, Exchange(queue_name), routing_key=queue_name),
)

celery = Celery(app_name, broker=app.config['CELERY_BROKER_URL'])
celery.config_from_object(app.config)
assets = Environment(app)
archive = archive.from_config(app.config)

if not app.debug and app.config.get('MAIL_ADMINS'):
    credentials = app.config.get('MAIL_CREDENTIALS', ())
    mail_handler = SMTPHandler(app.config.get('MAIL_HOST'),
                               app.config.get('MAIL_FROM'),
                               app.config.get('MAIL_ADMINS'),
                               '[%s] Crash report' % app_name,
                               credentials=credentials,
                               secure=())
    mail_handler.setLevel(logging.ERROR)
    app.logger.addHandler(mail_handler)


def system_role(role_name):
    from aleph.model import Role
    if not hasattr(app, '_authz_roles'):
        app._authz_roles = {}
        role = Role.load_or_create(Role.SYSTEM_GUEST, Role.SYSTEM,
                                   'All visitors')
        app._authz_roles[Role.SYSTEM_GUEST] = role.id
        role = Role.load_or_create(Role.SYSTEM_USER, Role.SYSTEM,
                                   'Logged-in users')
        app._authz_roles[Role.SYSTEM_USER] = role.id
        db.session.commit()
    return app._authz_roles.get(role_name)


def url_for(*a, **kw):
    """ Always generate external URLs. """
    try:
        kw['_external'] = True
        if app.config.get('PREFERRED_URL_SCHEME'):
            kw['_scheme'] = app.config.get('PREFERRED_URL_SCHEME')
        return flask_url_for(*a, **kw)
    except RuntimeError:
        return None
