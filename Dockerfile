FROM code4sa/aleph-python-base

COPY . /aleph
WORKDIR /aleph
ENV ALEPH_SETTINGS /aleph/contrib/docker_settings.py
RUN pip install git+git://github.com/Code4SA/aleph_zagazettecrawler.git && \
    pip install -q -e /aleph && \
    rm -rf /aleph/.git && \
    bower --allow-root --quiet install

CMD newrelic-admin run-program gunicorn --workers 1 -b 0.0.0.0:5000 --worker-class gevent --timeout 600 --max-requests 3000 --max-requests-jitter 100 --log-file - --access-logfile - aleph.manage:app
