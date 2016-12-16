web: assets
	python aleph/manage.py runserver -h 0.0.0.0 -p 8000

worker:
	celery -A aleph.queue -B -c 4 -l INFO worker --pidfile /var/lib/celery.pid

beat:
	celery -A aleph.queue beat -s /var/lib/celerybeat-schedule.db --pidfile /var/lib/celery.pid

clear:
	celery purge -f -A aleph.queue

assets:
	./node_modules/webpack/bin/webpack.js --env.dev

test:
	PGPASSWORD=aleph psql -h postgres -U aleph -c 'drop database if exists aleph_test;'
	PGPASSWORD=aleph psql -h postgres -U aleph -c 'create database aleph_test;'
	ALEPH_TEST_SETTINGS=$(ALEPH_SETTINGS) \
	SQLALCHEMY_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph_test \
	ELASTICSEARCH_INDEX=aleph_test \
	nosetests --with-coverage --cover-package=aleph --cover-erase

base:
	docker build -t pudo/aleph-base:1.6 contrib/base
	docker build -t pudo/aleph-base:latest contrib/base
	docker push pudo/aleph-base:1.6
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
