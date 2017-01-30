web: assets
	python aleph/manage.py runserver -h 0.0.0.0 -p 8000

worker:
	celery -A aleph.queues -B -c 4 -l INFO worker --pidfile /var/lib/celery.pid

beat:
	celery -A aleph.queues beat -s /var/lib/celerybeat-schedule.db --pidfile /var/lib/celery.pid

clear:
	celery purge -f -A aleph.queues

assets:
	touch aleph/static/style/_custom.scss;
	(test -f '$(CUSTOM_SCSS_PATH)' && cp -f $(CUSTOM_SCSS_PATH) aleph/static/style/_custom.scss) || exit 0
	./node_modules/webpack/bin/webpack.js --env.prod

assets-dev: assets
	./node_modules/webpack/bin/webpack.js --env.dev -w

test:
	PGPASSWORD=aleph psql -h postgres -U aleph -c 'drop database if exists aleph_test;'
	PGPASSWORD=aleph psql -h postgres -U aleph -c 'create database aleph_test;'
	PGPASSWORD=aleph psql -h postgres -U aleph aleph_test -c 'create extension pgcrypto;'
	nosetests --with-coverage --cover-package=aleph --cover-erase

base:
	docker build -t pudo/aleph-base:1.7 contrib/base
	docker build -t pudo/aleph-base:latest contrib/base
	docker push pudo/aleph-base:1.7
	docker push pudo/aleph-base:latest

build:
	docker build -t pudo/aleph:latest .
	docker push pudo/aleph:latest

docs: docs-clean
	sphinx-build -b html -d docs/_build/doctrees ./docs docs/_build/html

docs-clean:
	rm -rf docs/_build

docs-web:
	python -m SimpleHTTPServer 8000

.PHONY: build
