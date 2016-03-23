
web:
	python aleph/manage.py runserver

worker:
	celery -A aleph.queue -c 4 -l INFO worker

clear:
	celery purge -f -A aleph.queue

assets:
	bower install
	python aleph/manage.py assets --parse-templates build

test:
	nosetests --with-coverage --cover-package=aleph --cover-erase
