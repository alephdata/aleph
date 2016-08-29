
web:
	python aleph/manage.py runserver

worker:
	celery -A aleph.queue -B -c 4 -l INFO worker

clear:
	celery purge -f -A aleph.queue

assets:
	bower install
	SASS_PATH=`pwd`/aleph/static/style/ python aleph/manage.py assets --parse-templates build

test:
	nosetests --with-coverage --cover-package=aleph --cover-erase

base:
	docker build -t pudo/aleph-base:1.4 contrib/base
	docker build -t pudo/aleph-base:latest contrib/base
	docker push pudo/aleph-base:1.4
	docker push pudo/aleph-base:latest

build:
	docker build -t pudo/aleph:latest .
	docker push pudo/aleph:latest
