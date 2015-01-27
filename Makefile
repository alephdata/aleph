
web:
	python aleph/manage.py runserver

worker:
	celery -A aleph.queue -c 12 -l INFO worker

clear:
	celery purge -f -A aleph.queue
