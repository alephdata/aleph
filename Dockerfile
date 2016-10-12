FROM code4sa/aleph-python-base

COPY . /aleph
WORKDIR /aleph
ENV ALEPH_SETTINGS /aleph/contrib/docker_settings.py
RUN pip install newrelic==2.46.0.37 \
                git+git://github.com/Code4SA/aleph_zagazettecrawler.git \
                gevent==1.0.2 \
                greenlet==0.4.5

RUN pip install -q -e /aleph
RUN rm -rf /aleph/.git && bower --allow-root --quiet install

CMD newrelic-admin run-program gunicorn --workers 1 -b 0.0.0.0:8000 --worker-class gevent --timeout 600 --max-requests 3000 --max-requests-jitter 100 --log-file - --access-logfile - aleph.manage:app
