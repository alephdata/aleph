COMPOSE=docker-compose -f docker-compose.dev.yml
COMPOSE_E2E=docker-compose -f docker-compose.dev.yml -f docker-compose.e2e.yml
APPDOCKER=$(COMPOSE) run --rm app
UIDOCKER=$(COMPOSE) run --no-deps --rm ui
ALEPH_TAG=latest

all: build upgrade web

services:
	$(COMPOSE) up -d --remove-orphans \
		postgres elasticsearch ingest-file

shell: services
	$(APPDOCKER) /bin/bash

# To run a single test file:
# make test file=aleph/tests/test_manage.py
test:
	$(APPDOCKER) contrib/test.sh $(file)

test-ui:
	$(UIDOCKER) npm run test

lint:
	ruff check .

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
	docker build -t ghcr.io/alephdata/aleph-ui-production:$(ALEPH_TAG) -f ui/Dockerfile.production ui

build-e2e:
	$(COMPOSE_E2E) build --build-arg PLAYWRIGHT_VERSION=$(shell awk -F'==' '/^playwright==/ { print $$2 }' e2e/requirements.txt)

build-full: build build-ui build-e2e

ingest-restart:
	$(COMPOSE) up -d --no-deps --remove-orphans --force-recreate ingest-file

dev:
	python3 -m pip install --upgrade pip
	python3 -m pip install -q -r requirements.txt
	python3 -m pip install -q -r requirements-dev.txt

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

e2e/test-results:
	mkdir -p e2e/test-results

services-e2e:
	$(COMPOSE_E2E) up -d --remove-orphans \
		postgres elasticsearch ingest-file \

e2e: services-e2e e2e/test-results
	$(COMPOSE_E2E) run --rm app aleph upgrade
	$(COMPOSE_E2E) run --rm app aleph createuser --name="E2E Admin" --admin --password="admin" admin@admin.admin
	$(COMPOSE_E2E) up -d api ui worker
	BASE_URL=http://ui:8080 $(COMPOSE_E2E) run --rm --build-arg PLAYWRIGHT_VERSION=$(shell awk -F'==' '/^playwright==/ { print $$2 }' e2e/requirements.txt) e2e pytest -s -v --output=/e2e/test-results/ --screenshot=only-on-failure --video=retain-on-failure e2e/

e2e-local-setup: dev
	python3 -m pip install -q -r e2e/requirements.txt
	playwright install

e2e-local:
	pytest -s -v --screenshot only-on-failure e2e/

.PHONY: build services e2e

