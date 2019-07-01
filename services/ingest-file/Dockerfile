FROM ubuntu:19.04
ENV DEBIAN_FRONTEND noninteractive

# Enable non-free archive for `unrar`.
# RUN echo "deb http://http.us.debian.org/debian stretch non-free" >/etc/apt/sources.list.d/nonfree.list
RUN apt-get -qq -y update \
    && apt-get -q -y install build-essential locales ca-certificates \
        # python deps (mostly to install their dependencies)
        python3-pip python3-dev python3-pil \
        # libraries
        libxslt1-dev libpq-dev libldap2-dev libsasl2-dev \
        zlib1g-dev libicu-dev libxml2-dev \
        # package tools
        unrar p7zip-full \
        # audio & video metadata
        libmediainfo-dev \
        # image processing, djvu
        imagemagick-common imagemagick mdbtools djvulibre-bin \
        libtiff5-dev libjpeg-dev libfreetype6-dev libwebp-dev \
        libtiff-tools ghostscript librsvg2-bin \
        # pdf processing toolkit
        poppler-utils poppler-data pst-utils \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set up the locale and make sure the system uses unicode for the file system.
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales \
    && update-locale LANG=en_US.UTF-8
ENV LANG='en_US.UTF-8' \
    LC_ALL='en_US.UTF-8'

RUN groupadd -g 1000 -r app \
    && useradd -m -u 1000 -s /bin/false -g app app

RUN pip3 install --no-cache-dir -q -U pip setuptools six wheel nose coverage
COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

COPY . /ingestors
WORKDIR /ingestors
RUN pip3 install --no-cache-dir -e /ingestors
RUN chown -R app:app /ingestors

ENV ARCHIVE_TYPE=file \
    ARCHIVE_PATH=/data \
    BALKHASH_BACKEND=postgresql \
    BALKHASH_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph \
    REDIS_URL=redis://redis:6379/0 \
    OCR_SERVICE=recognize-text:50000 \
    UNOSERVICE_URL=http://convert-document:3000/convert

# USER app
CMD ingestors process