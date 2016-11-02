FROM python:2.7.10
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive

RUN echo "deb http://http.us.debian.org/debian stable non-free" >/etc/apt/sources.list.d/nonfree.list
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y dist-upgrade && apt-get install -y -q  \
        curl git python-pip python-virtualenv build-essential python-dev \
        libxml2-dev libxslt1-dev libpq-dev apt-utils ca-certificates less \
        postgresql-client-9.4 unrar unrar-free unzip locales libreoffice libopenjpeg5 \
        libtiff5-dev libjpeg-dev zlib1g-dev libfreetype6-dev liblcms2-dev \
        poppler-utils poppler-data unrtf pstotext python-numpy default-jdk \
        libwebp-dev tcl8.6-dev tk8.6-dev python-tk python-pil \
        libopenjpeg-dev imagemagick-common imagemagick unoconv mdbtools \
        cabextract p7zip-full libboost-python-dev libgsf-1-dev
RUN apt-get install -y -q  \
        libtesseract-dev ruby-sass wkhtmltopdf vim libjpeg-dev libicu-dev \
        tesseract-ocr tesseract-ocr-bel tesseract-ocr-aze \
        tesseract-ocr-ces tesseract-ocr-eng tesseract-ocr-deu \
        tesseract-ocr-spa tesseract-ocr-fra tesseract-ocr-osd \
        tesseract-ocr-hrv tesseract-ocr-hun tesseract-ocr-rus \
        tesseract-ocr-pol tesseract-ocr-slk tesseract-ocr-slv \
        tesseract-ocr-sqi tesseract-ocr-srp tesseract-ocr-tur \
        tesseract-ocr-ukr nodejs djvulibre-bin \
    && apt-get -y autoremove && apt-get clean
ENV TESSDATA_PREFIX /usr/share/tesseract-ocr

RUN wget --quiet -O /tmp/kat.deb http://ftp.us.debian.org/debian/pool/main/t/tesseract-ocr-kat/tesseract-ocr-kat_3.04.00-1_all.deb \
    && dpkg -x /tmp/kat.deb /tmp && cp /tmp/usr/share/tesseract-ocr/tessdata/kat.traineddata /usr/share/tesseract-ocr/tessdata \
    && rm -rf /tmp/kat.deb /tmp/usr

RUN wget --quiet -O /tmp/pst.tgz http://www.five-ten-sg.com/libpst/packages/libpst-0.6.69.tar.gz \
    && cd /tmp && tar xvfz pst.tgz && cd libpst-0.6.69 && ln -s /usr/bin/python /usr/bin/python2.7.10 \
    && ./configure && make && make install

RUN echo "en_GB ISO-8859-1" >> /etc/locale.gen && \
    echo "en_GB.ISO-8859-15 ISO-8859-15" >> /etc/locale.gen && \
    echo "en_GB.UTF-8 UTF-8" >> /etc/locale.gen && \
    echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen

# WebKit HTML to X install since the one that comes with distros is hellishly outdated.
RUN wget --quiet -O /tmp/wkhtmltox.tar.xv http://download.gna.org/wkhtmltopdf/0.12/0.12.3/wkhtmltox-0.12.3_linux-generic-amd64.tar.xz \
    && tar -xf /tmp/wkhtmltox.tar.xv -C /opt && rm -f /tmp/wkhtmltox.tar.xv
ENV WKHTMLTOPDF_BIN /opt/wkhtmltox/bin/wkhtmltopdf

# Node dependencies
RUN npm --quiet --silent install -g bower uglifyjs
