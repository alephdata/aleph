FROM debian:jessie
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive

# Enable non-free archive for `unrar`.
RUN echo "deb http://http.us.debian.org/debian stable non-free" >/etc/apt/sources.list.d/nonfree.list
# Enable Node.js archive
RUN echo 'deb http://deb.nodesource.com/node_6.x jessie main' > /etc/apt/sources.list.d/nodesource.list
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv 68576280

RUN apt-get update -y -q && apt-get -y dist-upgrade && apt-get install -y -q  \
        curl git python-pip python-virtualenv build-essential python-dev \
        libxml2-dev libxslt1-dev libpq-dev apt-utils ca-certificates less \
        postgresql-client-9.4 unrar unrar-free unzip locales libreoffice \
        libopenjpeg5 libtiff5-dev libjpeg-dev zlib1g-dev libfreetype6-dev \
        liblcms2-dev poppler-utils poppler-data unrtf pstotext python-numpy \
        default-jdk libwebp-dev tcl8.6-dev tk8.6-dev python-tk python-pil \
        libopenjpeg-dev imagemagick-common imagemagick unoconv mdbtools \
        cabextract p7zip-full libboost-python-dev libgsf-1-dev \
        libtesseract-dev vim libjpeg-dev libicu-dev libldap2-dev libsasl2-dev \
        tesseract-ocr tesseract-ocr-bel tesseract-ocr-aze \
        tesseract-ocr-ces tesseract-ocr-eng tesseract-ocr-deu \
        tesseract-ocr-spa tesseract-ocr-fra tesseract-ocr-osd \
        tesseract-ocr-hrv tesseract-ocr-hun tesseract-ocr-rus \
        tesseract-ocr-pol tesseract-ocr-slk tesseract-ocr-slv \
        tesseract-ocr-sqi tesseract-ocr-srp tesseract-ocr-tur \
        tesseract-ocr-ukr nodejs djvulibre-bin \
        && apt-get -y autoremove && apt-get clean

RUN curl -s /tmp/pst.tgz http://www.five-ten-sg.com/libpst/packages/libpst-0.6.69.tar.gz > /tmp/pst.tgz \
    && cd /tmp && tar xvfz pst.tgz && cd libpst-0.6.69 && ln -s /usr/bin/python /usr/bin/python2.7.10 \
    && ./configure && make && make install

RUN locale-gen 'en_GB' 'en_GB.ISO-8859-15' 'en_GB.UTF-8' 'en_US.UTF-8' 'C.UTF-8'
ENV LANG C.UTF-8

# WebKit HTML to X install since the one that comes with distros is hellishly outdated.
RUN curl -s http://download.gna.org/wkhtmltopdf/0.12/0.12.3/wkhtmltox-0.12.3_linux-generic-amd64.tar.xz > /tmp/wkhtmltox.tar.xv \
    && tar -xf /tmp/wkhtmltox.tar.xv -C /opt && rm -f /tmp/wkhtmltox.tar.xv
ENV WKHTMLTOPDF_BIN /opt/wkhtmltox/bin/wkhtmltopdf
ENV TESSDATA_PREFIX /usr/share/tesseract-ocr

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
