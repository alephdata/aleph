COMPOSE=docker-compose -f docker-compose.dev.yml 
DEVDOCKER=$(COMPOSE) run --rm app /aleph/contrib/devwrapper.sh

all: build upgrade web

shell:
	$(DEVDOCKER) /bin/bash

test: build
	$(DEVDOCKER) contrib/test.sh

upgrade: build
	$(COMPOSE) up -d postgres elasticsearch
	sleep 4
	$(DEVDOCKER) aleph upgrade

installdata:
	$(DEVDOCKER) aleph installdata

web:
	$(COMPOSE) run --rm api ui

worker:
	$(DEVDOCKER) celery -A aleph.queues -B -c 4 -l INFO worker --pidfile /var/lib/celery.pid

beat:
	$(DEVDOCKER) celery -A aleph.queues beat -s /var/lib/celerybeat-schedule.db --pidfile /var/lib/celery.pid

clear:
	$(DEVDOCKER) celery purge -f -A aleph.queues

stop:
	$(COMPOSE) stop

rebuild:
	$(COMPOSE) build --pull --no-cache

build:
	$(COMPOSE) build

docs:
	$(DEVDOCKER) sphinx-build -b html -d docs/_build/doctrees ./docs docs/_build/html

.PHONY: build
