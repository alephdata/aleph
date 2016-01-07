
web:
	python aleph/manage.py runserver

worker:
	celery -A aleph.queue -c 4 -l INFO worker

clear:
	celery purge -f -A aleph.queue

assets:
	bower install
	python aleph/manage.py assets --parse-templates build

base-image:
	docker build -t pudo/aleph-base:latest contrib/base-image
	docker push pudo/aleph-base:latest

