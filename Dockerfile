FROM python:3.12-slim
ENV DEBIAN_FRONTEND noninteractive
LABEL org.opencontainers.image.source = "https://github.com/dataresearchcenter/openaleph"

# build-essential
RUN apt-get -qq -y update \
    && apt-get -qq --no-install-recommends -y install locales \
    build-essential \
    ca-certificates postgresql-client libpq-dev curl jq unzip git \
    python3-pip python3-psycopg2 \
    python3-lxml python3-cryptography \
    pkg-config libicu-dev \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

RUN apt-get clean && apt-get autoremove

ENV LANG='en_US.UTF-8'

RUN groupadd -g 1000 -r app \
    && useradd -m -u 1000 -s /bin/false -g app app

# Add ftm-compare model data
ADD ./contrib/glm_bernoulli_2e_wf-v0.4.1.pkl /opt/ftm-compare/model.pkl
ADD ./contrib/word_frequencies-v0.4.1.zip /opt/ftm-compare/word-frequencies/word-frequencies.zip
RUN python3 -m zipfile --extract /opt/ftm-compare/word-frequencies/word-frequencies.zip /opt/ftm-compare/word-frequencies/ 

# Install Python dependencies
RUN pip3 install --no-cache-dir -q -U pip setuptools six lxml lxml_html_clean
RUN pip3 install --no-cache-dir -q -U git+https://github.com/dataresearchcenter/servicelayer.git
RUN pip3 install --no-binary=:pyicu: pyicu

COPY requirements.txt /tmp/
RUN pip3 install --no-deps --no-cache-dir -q -r /tmp/requirements.txt

# Install aleph
COPY . /aleph
WORKDIR /aleph
ENV PYTHONPATH /aleph
RUN pip install --no-cache-dir -q -e /aleph

ENV ALEPH_WORD_FREQUENCY_URI=https://public.data.occrp.org/develop/models/word-frequencies/word_frequencies-v0.4.1.zip
ENV ALEPH_FTM_COMPARE_MODEL_URI=https://public.data.occrp.org/develop/models/xref/glm_bernoulli_2e_wf-v0.4.1.pkl
RUN mkdir -p /opt/ftm-compare/word-frequencies/ && \
    curl -L -o "/opt/ftm-compare/word-frequencies/word-frequencies.zip" "$ALEPH_WORD_FREQUENCY_URI" && \
    python3 -m zipfile --extract /opt/ftm-compare/word-frequencies/word-frequencies.zip /opt/ftm-compare/word-frequencies/ && \
    curl -L -o "/opt/ftm-compare/model.pkl" "$ALEPH_FTM_COMPARE_MODEL_URI"

# Configure some docker defaults:
ENV ALEPH_ELASTICSEARCH_URI=http://elasticsearch:9200/ \
    ALEPH_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph \
    FTM_STORE_URI=postgresql://aleph:aleph@postgres/aleph \
    REDIS_URL=redis://redis:6379/0 \
    ARCHIVE_TYPE=file \
    ARCHIVE_PATH=/data \
    FTM_COMPARE_FREQUENCIES_DIR=/opt/ftm-compare/word-frequencies/ \
    FTM_COMPARE_MODEL=/opt/ftm-compare/model.pkl


RUN mkdir /run/prometheus

COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY docker-entrypoint.d /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
# Run the green unicorn
CMD gunicorn --config /aleph/gunicorn.conf.py --workers 6 --log-level info --log-file -
