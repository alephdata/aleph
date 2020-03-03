COMPOSE=docker-compose -f docker-compose.dev.yml
APPDOCKER=$(COMPOSE) run --rm app
INGESTDOCKER=$(COMPOSE) run --rm ingest-file
ALEPH_TAG=latest

all: build upgrade web

services:
	$(COMPOSE) up -d --remove-orphans \
		postgres elasticsearch ingest-file \
		convert-document

ingest-shell: services
	$(INGESTDOCKER) /bin/bash

ingest-tail:
	$(COMPOSE) logs -f ingest-file

shell: services
	$(APPDOCKER) /bin/bash

ingest-test:
	$(INGESTDOCKER) nosetests --with-coverage --cover-package=ingestors

ingest-restart:
	$(COMPOSE) build ingest-file convert-document
	$(COMPOSE) up --force-recreate --no-deps --detach convert-document ingest-file

test:
	$(APPDOCKER) contrib/test.sh

upgrade: build
	$(COMPOSE) up -d postgres elasticsearch
	sleep 10
	$(APPDOCKER) aleph upgrade

web: services
	$(COMPOSE) up api ui

worker: services
	$(COMPOSE) run --rm app aleph worker

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
	cp -r ../servicelayer/ .
	cp -r ../servicelayer/ ./services/ingest-file/
	$(COMPOSE) build
	rm -rf ./servicelayer/
	rm -rf ./services/ingest-file/servicelayer

build-ui:
	docker build -t alephdata/aleph-ui-production:$(ALEPH_TAG) -f ui/Dockerfile.production ui

build-full: build build-ui

docker-pull:
	$(COMPOSE) pull --include-deps --ignore-pull-failures

docker-push:
	docker push alephdata/aleph-elasticsearch:$(ALEPH_TAG)
	docker push alephdata/ingest-file:$(ALEPH_TAG)
	docker push alephdata/aleph:$(ALEPH_TAG)
	docker push alephdata/aleph-ui:$(ALEPH_TAG)
	docker push alephdata/aleph-ui-production:$(ALEPH_TAG)

dev:
	pip install -q bumpversion babel jinja2

fixtures:
	aleph crawldir --wait -f fixtures aleph/tests/fixtures/samples
	balkhash iterate -d fixtures >aleph/tests/fixtures/samples.ijson

# pybabel init -i aleph/translations/messages.pot -d aleph/translations -l de -D aleph
translate: dev
	pybabel extract -F babel.cfg -k lazy_gettext -o aleph/translations/messages.pot aleph
	tx push --source
	tx pull -a -f
	pybabel compile -d aleph/translations -D aleph -f

.PHONY: build services
