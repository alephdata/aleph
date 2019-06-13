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
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    sed -i -e 's/# en_GB.ISO-8859-15 ISO-8859-15/en_GB.ISO-8859-15 ISO-8859-15/' /etc/locale.gen && \
    locale-gen
ENV LANG='en_US.UTF-8' \
    LANGUAGE='en_US:en' \
    LC_ALL='en_US.UTF-8'

RUN pip3 install --no-cache-dir -q -U pip setuptools six wheel nose coverage
COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

COPY . /ingestors
WORKDIR /ingestors
RUN pip3 install --no-cache-dir -e /ingestors

ENV ARCHIVE_PATH=/data

CMD ingestors process