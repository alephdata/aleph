FROM ubuntu:19.10
ENV DEBIAN_FRONTEND noninteractive

# build-essential 
RUN apt-get -qq -y update \
    && apt-get -qq -y install locales \
    ca-certificates postgresql-client curl \
    python3-pip python3-dev python3-icu python3-psycopg2 \
    python3-lxml python3-crypto cython3 \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

ENV LANG='en_US.UTF-8'

RUN groupadd -g 1000 -r app \
    && useradd -m -u 1000 -s /bin/false -g app app

# Install Python dependencies
RUN pip3 install --no-cache-dir -q -U pip setuptools six

COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir -q -r /tmp/requirements.txt

# Install aleph
COPY . /aleph
WORKDIR /aleph
ENV PYTHONPATH /aleph
RUN pip install -q -e /aleph

# Configure some docker defaults:
ENV ALEPH_ELASTICSEARCH_URI=http://elasticsearch:9200/ \
    ALEPH_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph \
    FTM_STORE_URI=postgresql://aleph:aleph@postgres/aleph \
    REDIS_URL=redis://redis:6379/0 \
    ARCHIVE_TYPE=file \
    ARCHIVE_PATH=/data

# Run the green unicorn
CMD gunicorn -w 5 -b 0.0.0.0:8000 --log-level info --log-file - aleph.manage:app
