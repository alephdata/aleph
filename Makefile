COMPOSE=docker-compose -f docker-compose.dev.yml 
DEVDOCKER=$(COMPOSE) run --rm app

all: build upgrade web

services:
	$(COMPOSE) up -d --remove-orphans \
		rabbitmq postgres elasticsearch \
		convert-document extract-polyglot extract-spacy extract-countries

shell: services    
	$(DEVDOCKER) /bin/bash

test: build
	$(DEVDOCKER) contrib/test.sh

upgrade: build
	$(COMPOSE) up -d postgres elasticsearch
	sleep 10
	$(DEVDOCKER) aleph upgrade
	$(DEVDOCKER) celery purge -f -A aleph.queues

web: services
	$(COMPOSE) up api ui

worker: services
	$(COMPOSE) run --rm -e ALEPH_EAGER=false app celery -A aleph.queues -B -c 4 -l INFO worker --pidfile /tmp/celery.pid -s /tmp/celerybeat-schedule.db

purge:
	$(DEVDOCKER) celery purge -f -A aleph.queues

stop:
	$(COMPOSE) down --remove-orphans

clean:
	rm -rf dist build .eggs ui/build
	find . -name '*.egg-info' -exec rm -fr {} +
	find . -name '*.egg' -exec rm -f {} +
	find . -name '*.pyc' -exec rm -f {} +
	find . -name '*.pyo' -exec rm -f {} +
	find . -type d -name __pycache__ -exec rm -r {} \+
	find ui/src -name '*.css' -exec rm -f {} +

build:
	$(COMPOSE) build --pull

dev: 
	pip install -q transifex-client bumpversion babel

# pybabel init -i aleph/translations/messages.pot -d aleph/translations -l de -D aleph
translate: dev
	pybabel extract -F babel.cfg -k lazy_gettext -o aleph/translations/messages.pot aleph
	tx push --source
	tx pull --all
	pybabel compile -d aleph/translations -D aleph -f

.PHONY: build services
