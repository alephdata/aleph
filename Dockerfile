FROM debian:jessie
ENV DEBIAN_FRONTEND noninteractive

# Enable non-free archive for `unrar`.
RUN echo "deb http://http.us.debian.org/debian jessie non-free" >/etc/apt/sources.list.d/nonfree.list
RUN apt-get -qq -y update && apt-get -qq -y upgrade
RUN apt-get -qq -y install  \
        curl git python-pip python-virtualenv build-essential python-dev \
        libxml2-dev libxslt1-dev libpq-dev apt-utils ca-certificates less \
        postgresql-client-9.4 unrar unrar-free unzip locales libreoffice \
        libopenjpeg5 libtiff5-dev libjpeg-dev zlib1g-dev libfreetype6-dev \
        liblcms2-dev poppler-utils poppler-data unrtf pstotext python-numpy \
        default-jdk libwebp-dev tcl8.6-dev tk8.6-dev python-tk python-pil \
        libopenjpeg-dev imagemagick-common imagemagick mdbtools \
        cabextract p7zip-full libboost-python-dev libgsf-1-dev \
        libtesseract-dev vim libjpeg-dev libicu-dev libldap2-dev libsasl2-dev \
        tesseract-ocr tesseract-ocr-bel tesseract-ocr-aze \
        tesseract-ocr-ces tesseract-ocr-eng tesseract-ocr-deu \
        tesseract-ocr-spa tesseract-ocr-fra tesseract-ocr-osd \
        tesseract-ocr-hrv tesseract-ocr-hun tesseract-ocr-rus \
        tesseract-ocr-pol tesseract-ocr-slk tesseract-ocr-slv \
        tesseract-ocr-sqi tesseract-ocr-srp tesseract-ocr-tur \
        tesseract-ocr-ukr djvulibre-bin \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# New version of the PST file extractor
RUN curl -s http://www.five-ten-sg.com/libpst/packages/libpst-0.6.69.tar.gz > /tmp/pst.tgz \
    && cd /tmp \
    && tar xfz pst.tgz \
    && cd libpst-0.6.69 \
    && ln -s /usr/bin/python /usr/bin/python2.7.10 \
    && ./configure \
    && make \
    && make install \
    && rm -rf /tmp/pst.tgz /tmp/libpst-0.6.69

# WebKit HTML install since the one that comes with distros is hellishly outdated.
RUN curl -L -s https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.4/wkhtmltox-0.12.4_linux-generic-amd64.tar.xz > /tmp/wkhtmltox.tar.xv \
    && tar -xf /tmp/wkhtmltox.tar.xv -C /opt \
    && rm -f /tmp/wkhtmltox.tar.xv

# Set up the locale and make sure the system uses unicode for the file system.
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    sed -i -e 's/# en_GB.ISO-8859-15 ISO-8859-15/en_GB.ISO-8859-15 ISO-8859-15/' /etc/locale.gen && \
    locale-gen
ENV LANG='en_US.UTF-8' \
    LANGUAGE='en_US:en' \
    LC_ALL='en_US.UTF-8'

# Install Python dependencies
RUN pip install -q --upgrade pip && pip install -q --upgrade setuptools six
COPY requirements.txt requirements-docs.txt requirements-testing.txt /tmp/
RUN pip install -q -r /tmp/requirements.txt \
  && pip install --pre -q -r /tmp/requirements-docs.txt

# Install aleph
COPY . /aleph
WORKDIR /aleph
RUN pip install -q -e .

ENV WKHTMLTOPDF_BIN='/opt/wkhtmltox/bin/wkhtmltopdf' \
    TESSDATA_PREFIX='/usr/share/tesseract-ocr'

# Expose the green unicorn
EXPOSE 8000
CMD gunicorn -w 5 -b 0.0.0.0:8000 --name aleph_gunicorn \
  --log-level info --log-file /var/log/gunicorn.log \
  aleph.manage:app
