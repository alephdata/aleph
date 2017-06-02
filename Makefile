DEVDOCKER=docker-compose -f docker-compose.dev.yml run --rm app /aleph/contrib/devwrapper.sh

shell:
	$(DEVDOCKER) /bin/bash

test:
	$(DEVDOCKER) contrib/test.sh

upgrade: build
	$(DEVDOCKER) aleph upgrade
	$(DEVDOCKER) aleph installdata

web:
	docker-compose -f docker-compose.dev.yml run --rm -p 5000:5000 app \
		/aleph/contrib/devwrapper.sh python aleph/manage.py runserver -h 0.0.0.0

worker:
	$(DEVDOCKER) celery -A aleph.queues -B -c 4 -l INFO worker --pidfile /var/lib/celery.pid

beat:
	$(DEVDOCKER) celery -A aleph.queues beat -s /var/lib/celerybeat-schedule.db --pidfile /var/lib/celery.pid

clear:
	$(DEVDOCKER) celery purge -f -A aleph.queues

assets:
	touch aleph/static/style/_custom.scss;
	$(DEVDOCKER) /node_modules/webpack/bin/webpack.js --env.prod

assets-dev:
	$(DEVDOCKER) /node_modules/webpack/bin/webpack.js --env.dev -w

rebuild:
	docker-compose -f docker-compose.dev.yml build --pull --no-cache

build:
	docker-compose -f docker-compose.dev.yml build --pull


base:
	docker build -t alephdata/base:1.2 contrib/base
	docker build -t alephdata/base:latest contrib/base
	docker push alephdata/base:1.2
	docker push alephdata/base:latest

image-latest:
	docker build -t alephdata/aleph:latest .
	docker push alephdata/aleph:latest

image-release:
	docker build -t alephdata/aleph:1.2 .
	docker push alephdata/aleph:1.2

docs:
	$(DEVDOCKER) sphinx-build -b html -d docs/_build/doctrees ./docs docs/_build/html

.PHONY: build
