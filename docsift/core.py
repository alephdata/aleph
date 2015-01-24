from flask import Flask
from flask.ext.assets import Environment

from barn import open_archive

from docsift import default_settings

app = Flask('docsift')

app.config.from_object(default_settings)
app.config.from_envvar('DOCSIFT_SETTINGS', silent=True)

assets = Environment(app)

archive = open_archive(app.config.get('ARCHIVE_TYPE'),
                       **app.config.get('ARCHIVE_CONFIG'))
