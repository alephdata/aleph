FROM ubuntu:18.04
ENV DEBIAN_FRONTEND noninteractive

# Enable non-free archive for `unrar`.
# RUN echo "deb http://http.us.debian.org/debian stretch non-free" >/etc/apt/sources.list.d/nonfree.list
RUN apt-get -qq -y update \
    && apt-get -qq -y install build-essential locales ca-certificates \
        # needed to set up DB for tests:
        postgresql-client \
        # python deps (mostly to install their dependencies)
        python3-pip python3-dev python3-pil \
        # libraries
        libxslt1-dev libpq-dev libldap2-dev libsasl2-dev \
        zlib1g-dev libicu-dev libxml2-dev \
        # package tools
        unrar p7zip-full  \
        # audio & video metadata
        libmediainfo-dev \
        # image processing, djvu
        imagemagick-common imagemagick mdbtools djvulibre-bin \
        libtiff5-dev libjpeg-dev libfreetype6-dev libwebp-dev \
        # tesseract
        # libtesseract-dev tesseract-ocr-all libleptonica-dev \
        # pdf processing toolkit
        poppler-utils poppler-data pst-utils \
        # to be determined:
        # libcurl4-gnutls-dev librtmp-dev pstotext \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set up the locale and make sure the system uses unicode for the file system.
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    sed -i -e 's/# en_GB.ISO-8859-15 ISO-8859-15/en_GB.ISO-8859-15 ISO-8859-15/' /etc/locale.gen && \
    locale-gen
ENV LANG='en_US.UTF-8' \
    LANGUAGE='en_US:en' \
    LC_ALL='en_US.UTF-8'

RUN pip3 install -q --upgrade pip setuptools six

# Install Python dependencies
COPY requirements-generic.txt /tmp/
RUN pip3 install -q -r /tmp/requirements-generic.txt && rm -rf /root/.cache
COPY requirements-toolkit.txt /tmp/
RUN pip3 install -q -r /tmp/requirements-toolkit.txt && rm -rf /root/.cache

# Install aleph
COPY . /aleph
WORKDIR /aleph
ENV PYTHONPATH /aleph
RUN pip install -e /aleph
RUN cd /usr/local/lib/python3.6/dist-packages && python3 /aleph/setup.py develop


# Configure some docker defaults:
ENV C_FORCE_ROOT=true \
    UNOSERVICE_URL=http://convert-document:3000/convert \
    ALEPH_ELASTICSEARCH_URI=http://elasticsearch:9200/ \
    ALEPH_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph \
    ALEPH_BROKER_URI=amqp://guest:guest@rabbitmq:5672 \
    ALEPH_ARCHIVE_PATH=/data

# Run the green unicorn
CMD gunicorn -w 5 -b 0.0.0.0:8000 --name aleph_gunicorn \
  --log-level info --log-file /var/log/gunicorn.log \
  aleph.manage:app
