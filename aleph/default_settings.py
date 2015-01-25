from os import environ as env

DEBUG = True
ASSETS_DEBUG = True

APP_TITLE = 'The Aleph'

ARCHIVE_TYPE = 'file'
ARCHIVE_CONFIG = {'path': '/Users/fl/Data/docsift-archive'}

SECRET_KEY = env.get('SECRET_KEY', 'banana pancakes')

SQLALCHEMY_DATABASE_URI = env.get('DATABASE_URL', 'sqlite:///aleph.sqlite3')
ELASTICSEARCH_URL = env.get('BONSAI_URL', 'http://localhost:9200')

CELERY_ALWAYS_EAGER = False
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = 'UTC'
CELERY_BROKER_URL = env.get('RABBITMQ_BIGWIG_URL',
                            'amqp://guest:guest@localhost:5672//')
