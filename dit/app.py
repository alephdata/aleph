import logging
from flask import Flask

from docstash import Stash

from dit import default_settings
from dit.manager import load_stages

logging.basicConfig(level=logging.INFO)

app = Flask('dit')

app.config.from_object(default_settings)
app.config.from_envvar('DIT_SETTINGS', silent=True)

stages = load_stages()
stash = Stash(path=app.config.get('STASH_PATH'))

print stages, stash
