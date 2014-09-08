from flask import Flask
from flask.ext.assets import Environment

from docstash import Stash

from docsift import default_settings
from docsift import logs

app = Flask('docsift')

app.config.from_object(default_settings)
app.config.from_envvar('DOCSIFT_SETTINGS', silent=True)

assets = Environment(app)

stash = Stash(path=app.config.get('DOCSTASH_PATH'))
