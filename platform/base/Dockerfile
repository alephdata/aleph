FROM ubuntu:18.04
ENV DEBIAN_FRONTEND noninteractive
RUN mkdir -p /opt/data

##########################################################################################################
# Base installation
#
# Enable non-free archive for `unrar`.
# RUN echo "deb http://http.us.debian.org/debian stretch non-free" >/etc/apt/sources.list.d/nonfree.list
RUN apt-get -qq -y update \
    && apt-get -qq -y install build-essential git locales ca-certificates \
        # needed to set up DB for tests:
        postgresql-client \
        # python deps (mostly to install their dependencies)
        python3-pip python3-dev python3-pil \
        # libraries
        libxslt1-dev libpq-dev libldap2-dev libsasl2-dev \
        zlib1g-dev libicu-dev libxml2-dev \
        # package tools
        unrar p7zip-full unzip \
        # audio & video metadata
        libmediainfo-dev \
        # image processing, djvu
        imagemagick-common imagemagick mdbtools djvulibre-bin \
        libtiff5-dev libjpeg-dev libfreetype6-dev libwebp-dev \
        libtiff-tools \
        # tesseract
        # libtesseract-dev tesseract-ocr-all libleptonica-dev \
        # pdf processing toolkit
        poppler-utils poppler-data pst-utils \
        # to be determined:
        # libcurl4-gnutls-dev librtmp-dev pstotext \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


##########################################################################################################
# Locale configuration
#
# Set up the locale and make sure the system uses unicode for the file system.
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    sed -i -e 's/# en_GB.ISO-8859-15 ISO-8859-15/en_GB.ISO-8859-15 ISO-8859-15/' /etc/locale.gen && \
    locale-gen

ENV LANG='en_US.UTF-8' \
    LANGUAGE='en_US:en' \
    LC_ALL='en_US.UTF-8'


##########################################################################################################
# Geonames locations parser
#
ENV ALEPH_GEONAMES_DATA=/opt/data/geonames.txt
RUN curl -s -o /tmp/allCountries.zip https://download.geonames.org/export/dump/allCountries.zip \
    && unzip -p /tmp/allCountries.zip | grep "ADM1\|PCLI\|PCLD\|PPLC\|PPLA" >${ALEPH_GEONAMES_DATA} \
    && rm /tmp/allCountries.zip


##########################################################################################################
# Python basics
#
RUN pip3 install -q --upgrade pip setuptools six
