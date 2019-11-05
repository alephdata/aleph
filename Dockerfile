FROM ubuntu:20.04
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq -y update \
    && apt-get -q -y install build-essential locales \
        ca-certificates postgresql-client \
        python3-pip python3-dev python3-icu python3-psycopg2 \
        python3-lxml python3-crypto cython3 \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set up the locale and make sure the system uses unicode for the file system.
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure locales \
    && update-locale LANG=en_US.UTF-8
ENV LANG='en_US.UTF-8' \
    LC_ALL='en_US.UTF-8'

RUN groupadd -g 1000 -r app \
    && useradd -m -u 1000 -s /bin/false -g app app

# Install Python dependencies
RUN pip3 install --no-cache-dir -q -U pip setuptools six

# Install spaCy and link models to three-letter language codes
RUN pip3 install --no-cache-dir -q spacy==2.2.1
RUN python3 -m spacy download xx_ent_wiki_sm \
    && python3 -m spacy link xx_ent_wiki_sm xx
RUN python3 -m spacy download en_core_web_sm \
    && python3 -m spacy link en_core_web_sm eng
RUN python3 -m spacy download de_core_news_sm \
    && python3 -m spacy link de_core_news_sm deu
RUN python3 -m spacy download fr_core_news_sm \
    && python3 -m spacy link fr_core_news_sm fra
RUN python3 -m spacy download es_core_news_sm \
    && python3 -m spacy link es_core_news_sm spa
RUN python3 -m spacy download pt_core_news_sm \
    && python3 -m spacy link pt_core_news_sm por
ENV ALEPH_NER_MODELS=eng:deu:fra:spa:por

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
    BALKHASH_BACKEND=postgresql \
    BALKHASH_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph \
    REDIS_URL=redis://redis:6379/0 \
    ARCHIVE_TYPE=file \
    ARCHIVE_PATH=/data

# Run the green unicorn
CMD gunicorn -w 5 -b 0.0.0.0:8000 --log-level info --log-file - aleph.manage:app
