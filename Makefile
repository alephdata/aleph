COMPOSE=docker-compose -f docker-compose.dev.yml 
APPDOCKER=$(COMPOSE) run --rm app
INGESTDOCKER=$(COMPOSE) run --rm ingest-file
TAG=latest

all: build upgrade web

services:
	$(COMPOSE) up -d --remove-orphans \
		postgres elasticsearch ingest-file \
		convert-document recognize-text

ingest-shell: services    
	$(INGESTDOCKER) /bin/bash

shell: services
	$(APPDOCKER) /bin/bash

ingest-test:
	$(INGESTDOCKER) nosetests --with-coverage --cover-package=ingestors

test:
	$(APPDOCKER) contrib/test.sh

upgrade: build
	$(COMPOSE) up -d postgres elasticsearch
	sleep 10
	$(APPDOCKER) aleph upgrade
	$(APPDOCKER) celery purge -f -A aleph.queues

web: services
	$(COMPOSE) up api ui

worker: services
	$(COMPOSE) run --rm -e ALEPH_EAGER=false app celery -A aleph.queues -B -c 4 -l INFO worker

purge:
	$(APPDOCKER) celery purge -f -A aleph.queues

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
	docker build -t alephdata/aleph-ui-production:$(TAG) -f ui/Dockerfile.production ui

build-full: build build-ui

docker-pull:
	docker pull alephdata/aleph
	docker pull alephdata/aleph-ui

docker-push:
	docker push alephdata/aleph:$(TAG)
	docker push alephdata/aleph-ui:$(TAG)
	docker push alephdata/aleph-ui-production:$(TAG)

dev: 
	pip install -q transifex-client bumpversion babel jinja2

fixtures:
	aleph crawldir --wait -f fixtures aleph/tests/fixtures/samples
	balkhash iterate -d fixtures >aleph/tests/fixtures/samples.ijson

contrib/allCountries.zip:
	curl -s -o contrib/allCountries.zip https://download.geonames.org/export/dump/allCountries.zip

geonames: contrib/allCountries.zip
	unzip -p contrib/allCountries.zip | grep "ADM1\|PCLI\|PCLD\|PPLC\|PPLA" >contrib/geonames.txt

# pybabel init -i aleph/translations/messages.pot -d aleph/translations -l de -D aleph
translate: dev
	pybabel extract -F babel.cfg -k lazy_gettext -o aleph/translations/messages.pot aleph
	tx push --source
	tx pull -a -f
	pybabel compile -d aleph/translations -D aleph -f

.PHONY: build services
