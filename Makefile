egg-info:
	pip install -q -e .

web: egg-info assets
	python aleph/manage.py runserver -h 0.0.0.0 -p 8000

worker: egg-info
	celery -A aleph.queues -B -c 4 -l INFO worker --pidfile /var/lib/celery.pid

beat: egg-info
	celery -A aleph.queues beat -s /var/lib/celerybeat-schedule.db --pidfile /var/lib/celery.pid

clear: egg-info
	celery purge -f -A aleph.queues

assets:
	touch aleph/static/style/_custom.scss;
	(test -f '$(CUSTOM_SCSS_PATH)' && cp -f $(CUSTOM_SCSS_PATH) aleph/static/style/_custom.scss) || exit 0
	/node_modules/webpack/bin/webpack.js --env.prod

assets-dev: assets
	/node_modules/webpack/bin/webpack.js --env.dev -w

test: egg-info
	PGPASSWORD=aleph psql -h postgres -U aleph -c 'drop database if exists aleph_test;'
	PGPASSWORD=aleph psql -h postgres -U aleph -c 'create database aleph_test;'
	nosetests --with-coverage --cover-package=aleph --cover-erase

base:
	docker build -t alephdata/base:1.2 contrib/base
	docker build -t alephdata/base:latest contrib/base
	docker push alephdata/base:1.2
	docker push alephdata/base:latest

build:
	docker build -t alephdata/aleph:latest .
	docker push alephdata/aleph:latest

docs: egg-info docs-clean
	sphinx-build -b html -d docs/_build/doctrees ./docs docs/_build/html

docs-clean:
	rm -rf docs/_build

docs-web:
	python -m SimpleHTTPServer 8000

.PHONY: build
