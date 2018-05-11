FROM alephdata/platform:2.1.0

# Install Python dependencies
COPY requirements-generic.txt /tmp/
RUN pip install -q -r /tmp/requirements-generic.txt && rm -rf /root/.cache
COPY requirements-toolkit.txt /tmp/
RUN pip install -q -r /tmp/requirements-toolkit.txt && rm -rf /root/.cache

# Install aleph
COPY . /aleph
WORKDIR /aleph
ENV PYTHONPATH /aleph
RUN cd /usr/local/lib/python2.7/site-packages && python /aleph/setup.py develop

# Configure some docker defaults:
ENV C_FORCE_ROOT=true \
    ALEPH_ELASTICSEARCH_URI=http://elasticsearch:9200/ \
    ALEPH_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph \
    ALEPH_BROKER_URI=amqp://guest:guest@rabbitmq:5672 \
    ALEPH_ARCHIVE_PATH=/data \
    POLYGLOT_DATA_PATH=/polyglot \
    UNOSERVICE_URL=http://unoservice:3000/convert

# Run the green unicorn
CMD gunicorn -w 5 -b 0.0.0.0:8000 --name aleph_gunicorn \
  --log-level info --log-file /var/log/gunicorn.log \
  aleph.manage:app
