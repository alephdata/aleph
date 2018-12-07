FROM alephdata/aleph-base:6

# Install Python dependencies
COPY requirements-generic.txt /tmp/
RUN pip3 install -r /tmp/requirements-generic.txt && rm -rf /root/.cache
COPY requirements-toolkit.txt /tmp/
RUN pip3 install -r /tmp/requirements-toolkit.txt && rm -rf /root/.cache

# Install aleph
COPY . /aleph
WORKDIR /aleph
ENV PYTHONPATH /aleph
RUN pip install -e /aleph
# RUN cd /usr/local/lib/python3.6/dist-packages && python3 /aleph/setup.py develop

# Configure some docker defaults:
ENV C_FORCE_ROOT=true \
    UNOSERVICE_URL=http://convert-document:3000/convert \
    ALEPH_ELASTICSEARCH_URI=http://elasticsearch:9200/ \
    ALEPH_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph \
    ALEPH_BROKER_URI=amqp://guest:guest@rabbitmq:5672 \
    ALEPH_ARCHIVE_PATH=/data

# Run the green unicorn
CMD gunicorn -w 5 -b 0.0.0.0:8000 --log-level info --log-file - aleph.manage:app
