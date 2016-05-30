FROM python:2.7.10
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive

RUN echo "deb http://http.us.debian.org/debian stable non-free" >/etc/apt/sources.list.d/nonfree.list
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y dist-upgrade && apt-get install -y -q  \
        curl git python-pip python-virtualenv build-essential python-dev \
        libxml2-dev libxslt1-dev libpq-dev apt-utils ca-certificates less \
        postgresql-client-9.4 unrar unzip locales libreoffice libopenjpeg5 \
        libtiff5-dev libjpeg-dev zlib1g-dev libfreetype6-dev liblcms2-dev \
        poppler-utils poppler-data unrtf pstotext python-numpy default-jdk \
        readpst libwebp-dev tcl8.6-dev tk8.6-dev python-tk python-pil \
        libopenjpeg-dev imagemagick-common imagemagick unoconv \
        libtesseract-dev ruby-sass wkhtmltopdf vim libjpeg-dev libicu-dev \
        tesseract-ocr tesseract-ocr-bel tesseract-ocr-aze \
        tesseract-ocr-ces tesseract-ocr-eng tesseract-ocr-deu \
        tesseract-ocr-spa tesseract-ocr-fra tesseract-ocr-osd \
        tesseract-ocr-hrv tesseract-ocr-hun tesseract-ocr-rus \
        tesseract-ocr-pol tesseract-ocr-slk tesseract-ocr-slv \
        tesseract-ocr-sqi tesseract-ocr-srp tesseract-ocr-tur \
        tesseract-ocr-ukr nodejs \ 
  && apt-get -y autoremove && apt-get clean
ENV TESSDATA_PREFIX /usr/share/tesseract-ocr

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
