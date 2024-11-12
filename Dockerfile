FROM python:3.12-slim
ENV DEBIAN_FRONTEND noninteractive
LABEL org.opencontainers.image.source = "https://github.com/investigativedata/aleph"

# build-essential
RUN apt-get -qq -y update \
    && apt-get -qq --no-install-recommends -y install locales \
    ca-certificates postgresql-client libpq-dev curl jq unzip git \
    python3-pip python3-icu python3-psycopg2 \
    python3-lxml python3-cryptography \
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

COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir -q -r /tmp/requirements.txt

# Install aleph
COPY . /aleph
WORKDIR /aleph
ENV PYTHONPATH /aleph
RUN pip install --no-cache-dir -q -e /aleph

# Configure some docker defaults:
ENV FTM_COMPARE_FREQUENCIES_DIR=/opt/ftm-compare/word-frequencies/ \
    FTM_COMPARE_MODEL=/opt/ftm-compare/model.pkl

RUN mkdir /run/prometheus

COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY docker-entrypoint.d /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
# Run the green unicorn
CMD gunicorn --config /aleph/gunicorn.conf.py --workers 6 --log-level info --log-file -
