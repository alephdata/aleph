COMPOSE=docker-compose -f docker-compose.dev.yml 
DEVDOCKER=$(COMPOSE) run --rm app

all: build upgrade web

services:
	$(COMPOSE) up -d rabbitmq unoservice postgres elasticsearch

shell: services    
	$(DEVDOCKER) /bin/bash

test: build
	$(DEVDOCKER) contrib/test.sh

upgrade: build
	$(COMPOSE) up -d postgres elasticsearch
	sleep 4
	$(DEVDOCKER) aleph upgrade
	$(DEVDOCKER) celery purge -f -A aleph.queues

installdata:
	$(DEVDOCKER) aleph installdata

web: services
	$(COMPOSE) up api ui

worker: services
	$(COMPOSE) run --rm -e ALEPH_EAGER=false app celery -A aleph.queues -B -c 4 -l INFO worker --pidfile /tmp/celery.pid -s /tmp/celerybeat-schedule.db

purge:
	$(DEVDOCKER) celery purge -f -A aleph.queues

clean:
	$(COMPOSE) down
	$(COMPOSE) rm -f

rebuild:
	$(COMPOSE) build --pull --no-cache

build:
	$(COMPOSE) build

docs:
	$(DEVDOCKER) sphinx-build -b html -d docs/_build/doctrees ./docs docs/_build/html

.PHONY: build
