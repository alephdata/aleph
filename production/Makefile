VERSION=2.0.13
DOCKER=docker-compose run --rm shell

all: pull upgrade up

services:
	docker-compose up -d --remove-orphans \
		rabbitmq postgres elasticsearch \
		convert-document extract-polyglot extract-spacy

shell: services    
	$(DOCKER) /bin/bash

upgrade: services
	sleep 10
	$(DOCKER) aleph upgrade
	$(DOCKER) celery purge -f -A aleph.queues

up: services
	docker-compose up

clean:
	docker-compose down --remove-orphans

pull:
	docker-compose build --pull
