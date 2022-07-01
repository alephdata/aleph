COMPOSE=docker-compose -f docker-compose.dev.yml
APPDOCKER=$(COMPOSE) run --rm app
UIDOCKER=$(COMPOSE) run --no-deps --rm ui
ALEPH_TAG=latest

all: build upgrade web

services:
	$(COMPOSE) up -d --remove-orphans \
		postgres elasticsearch ingest-file \
		convert-document

shell: services
	$(APPDOCKER) /bin/bash

shell-ui: services
	$(UIDOCKER) /bin/bash

test:
	$(APPDOCKER) contrib/test.sh

test-ui:
	$(UIDOCKER) npm run test

lint:
	flake8 aleph/

lint-ui:
	$(UIDOCKER) npm run lint

format:
	black aleph/

format-ui:
	$(UIDOCKER) npm run format

format-check:
	black --check aleph/

format-check-ui:
	$(UIDOCKER) npm run format:check

upgrade: build
	$(COMPOSE) up -d postgres elasticsearch
	sleep 10
	$(APPDOCKER) aleph upgrade

api: services
	$(COMPOSE) up --abort-on-container-exit api

web: services
	$(COMPOSE) up api ui

worker: services
	$(COMPOSE) run -p 127.0.0.1:5679:5679 --rm app python3 -m debugpy --listen 0.0.0.0:5679 -c "from aleph.manage import cli; cli()" worker

tail:
	$(COMPOSE) logs -f

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
	$(COMPOSE) build

build-ui:
	docker build -t alephdata/aleph-ui-production:$(ALEPH_TAG) -f ui/Dockerfile.production ui

build-full: build build-ui

ingest-restart:
	$(COMPOSE) up -d --no-deps --remove-orphans --force-recreate ingest-file convert-document

dev: 
	pip install -q -r requirements-dev.txt

fixtures:
	aleph crawldir --wait -f fixtures aleph/tests/fixtures/samples
	balkhash iterate -d fixtures >aleph/tests/fixtures/samples.ijson

# pybabel init -i aleph/translations/messages.pot -d aleph/translations -l de -D aleph
translate: dev
	npm run --prefix ui messages
	pybabel extract -F babel.cfg -k lazy_gettext -o aleph/translations/messages.pot aleph
	tx push --source
	tx pull -a -f
	npm run --prefix ui translate
	pybabel compile -d aleph/translations -D aleph -f

.PHONY: build services

