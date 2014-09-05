import logging
from flask import Flask
from flask.ext.assets import Environment

from docstash import Stash

from dit import default_settings

logging.basicConfig(level=logging.DEBUG)

# specific loggers
requests_log = logging.getLogger("requests")
requests_log.setLevel(logging.WARNING)

urllib3_log = logging.getLogger("urllib3")
urllib3_log.setLevel(logging.WARNING)

#elasticsearch_log = logging.getLogger("elasticsearch")
#elasticsearch_log.setLevel(logging.WARNING)

elasticsearch_log = logging.getLogger("elasticsearch.trace")
elasticsearch_log.setLevel(logging.DEBUG)


stevedore_log = logging.getLogger("stevedore")
stevedore_log.setLevel(logging.WARNING)

app = Flask('dit')

app.config.from_object(default_settings)
app.config.from_envvar('DIT_SETTINGS', silent=True)

assets = Environment(app)

stash = Stash(path=app.config.get('DOCSTASH_PATH'))
