FROM ubuntu:19.04
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq -y update \
    && apt-get -qq -y install build-essential locales \
        ca-certificates postgresql-client \
        python3-pip python3-dev python3-icu python3-psycopg2 \
        python3-lxml python3-crypto python3-gunicorn \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set up the locale and make sure the system uses unicode for the file system.
RUN localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LANG en_US.utf8

# Install Python dependencies
RUN pip3 install --no-cache-dir -q -U pip setuptools six
RUN pip3 install --no-cache-dir -q spacy==2.1.4
RUN python3 -m spacy download xx
COPY requirements-generic.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements-generic.txt
COPY requirements-toolkit.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements-toolkit.txt

# Install aleph
COPY . /aleph
WORKDIR /aleph
ENV PYTHONPATH /aleph
RUN pip install -e /aleph
# RUN cd /usr/local/lib/python3.6/dist-packages && python3 /aleph/setup.py develop

# Configure some docker defaults:
ENV ALEPH_ELASTICSEARCH_URI=http://elasticsearch:9200/ \
    ALEPH_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph \
    ALEPH_GEONAMES_DATA=/aleph/contrib/geonames.txt \
    REDIS_URL=redis://redis:6379/0 \
    ARCHIVE_PATH=/data

# Run the green unicorn
CMD gunicorn -w 5 -b 0.0.0.0:8000 --log-level info --log-file - aleph.manage:app
