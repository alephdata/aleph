FROM debian:stretch
ENV DEBIAN_FRONTEND noninteractive

# Enable non-free archive for `unrar`.
RUN echo "deb http://http.us.debian.org/debian stretch non-free" >/etc/apt/sources.list.d/nonfree.list
RUN apt-get -qq -y update \
    && apt-get -qq -y upgrade \
    && apt-get -qq -y install wget git less \
        python-pip build-essential python-dev libxml2-dev libxslt1-dev \
        libpq-dev apt-utils ca-certificates postgresql-client unrar locales \
        libtiff5-dev libjpeg-dev zlib1g-dev libfreetype6-dev liblcms2-dev \
        poppler-utils poppler-data unrtf pstotext libwebp-dev python-pil \
        imagemagick-common imagemagick mdbtools p7zip-full libboost-python-dev libgsf-1-dev \
        libtesseract-dev libjpeg-dev libicu-dev libldap2-dev libsasl2-dev djvulibre-bin \
        libleptonica-dev \    
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Make a separate layer for this.
RUN apt-get -qq -y update \
    && apt-get -qq -y install tesseract-ocr-all \    
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# New version of the PST file extractor
RUN mkdir /tmp/libpst \
    && wget -qO- http://www.five-ten-sg.com/libpst/packages/libpst-0.6.71.tar.gz | tar xz -C /tmp/libpst --strip-components=1 \
    && cd /tmp/libpst \
    && ln -s /usr/bin/python /usr/bin/python2.7.10 \
    && ./configure \
    && make \
    && make install \
    && rm -rf /tmp/libpst

# Set up the locale and make sure the system uses unicode for the file system.
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    sed -i -e 's/# en_GB.ISO-8859-15 ISO-8859-15/en_GB.ISO-8859-15 ISO-8859-15/' /etc/locale.gen && \
    locale-gen
ENV LANG='en_US.UTF-8' \
    LANGUAGE='en_US:en' \
    LC_ALL='en_US.UTF-8'

# Install Python dependencies
RUN pip install -q --upgrade pip && pip install -q --upgrade setuptools six
COPY requirements-generic.txt /tmp/
RUN pip install -q -r /tmp/requirements-generic.txt
COPY requirements-toolkit.txt /tmp/
RUN pip install -r /tmp/requirements-toolkit.txt

# Install aleph
COPY . /aleph
WORKDIR /aleph
ENV PYTHONPATH /aleph
RUN cd /usr/local/lib/python2.7/site-packages && python /aleph/setup.py develop

# Run the green unicorn
CMD gunicorn -w 5 -b 0.0.0.0:8000 --name aleph_gunicorn \
  --log-level info --log-file /var/log/gunicorn.log \
  aleph.manage:app
