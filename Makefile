COMPOSE=docker-compose -f docker-compose.dev.yml 
DEVDOCKER=$(COMPOSE) run --rm app

all: build upgrade web

services:
	$(COMPOSE) up -d --remove-orphans \
		rabbitmq postgres elasticsearch \
		convert-document extract-entities \
		extract-countries recognize-text

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
	docker build --cache-from alephdata/aleph -t alephdata/aleph .
	docker build --cache-from alephdata/ui -t alephdata/ui ui
	docker build --compress --cache-from alephdata/aleph-convert-document -t alephdata/aleph-convert-document services/convert-document
	docker build --compress --cache-from alephdata/aleph-recognize-text -t alephdata/aleph-recognize-text services/recognize-text
	docker build --compress --cache-from alephdata/aleph-extract-entities -t alephdata/aleph-extract-entities services/extract-entities
	docker build --compress --cache-from alephdata/aleph-extract-countries -t alephdata/aleph-extract-countries services/extract-countries
	$(COMPOSE) build

pull:
	docker pull alephdata/aleph
	docker pull alephdata/ui
	docker pull alephdata/aleph-convert-document
	docker pull alephdata/aleph-recognize-text
	docker pull alephdata/aleph-extract-entities
	docker pull alephdata/aleph-extract-countries

evil-direct:
	docker push alephdata/aleph-convert-document
	docker push alephdata/aleph-recognize-text
	docker push alephdata/aleph-extract-entities
	docker push alephdata/aleph-extract-countries

dev: 
	pip install -q transifex-client bumpversion babel

# pybabel init -i aleph/translations/messages.pot -d aleph/translations -l de -D aleph
translate: dev
	pybabel extract -F babel.cfg -k lazy_gettext -o aleph/translations/messages.pot aleph
	tx push --source
	tx pull --all
	pybabel compile -d aleph/translations -D aleph -f

.PHONY: build services
