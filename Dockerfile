FROM python:2.7.10
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive

RUN echo "deb http://http.us.debian.org/debian stable non-free" >/etc/apt/sources.list.d/nonfree.list
RUN apt-get update -qq && apt-get install -y -q --no-install-recommends \
        curl git python-pip python-virtualenv build-essential python-dev \
        libxml2-dev libxslt1-dev libpq-dev apt-utils ca-certificates less \
        postgresql-client-9.4 unrar unzip locales libreoffice libopenjpeg5 \
        tesseract-ocr tesseract-ocr-bel tesseract-ocr-aze libopenjpeg-dev \
        tesseract-ocr-osd imagemagick-common imagemagick unoconv \
        libtesseract-dev ruby-sass wkhtmltopdf vim libjpeg-dev \
        tesseract-ocr-ces tesseract-ocr-eng tesseract-ocr-deu \
        tesseract-ocr-hrv tesseract-ocr-hun tesseract-ocr-rus \
        tesseract-ocr-pol tesseract-ocr-slk tesseract-ocr-slv \
        tesseract-ocr-sqi tesseract-ocr-srp tesseract-ocr-tur \
        tesseract-ocr-ukr poppler-utils poppler-data unrtf pstotext zlib1g-dev \
        python-numpy default-jdk \
  && apt-get clean
ENV TESSDATA_PREFIX /usr/share/tesseract-ocr

RUN echo "en_GB ISO-8859-1" >> /etc/locale.gen && \
    echo "en_GB.ISO-8859-15 ISO-8859-15" >> /etc/locale.gen && \
    echo "en_GB.UTF-8 UTF-8" >> /etc/locale.gen && \
    echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen

# A Node, for good measure.
RUN curl -sL https://deb.nodesource.com/setup | bash -
RUN apt-get install -y nodejs && curl -L https://www.npmjs.org/install.sh | sh
RUN npm install -g bower uglifyjs

# WebKit HTML to X install since the one that comes with distros is hellishly outdated.
RUN wget -O /tmp/wkhtmltox.tar.xv http://download.gna.org/wkhtmltopdf/0.12/0.12.3/wkhtmltox-0.12.3_linux-generic-amd64.tar.xz \
    && tar -xf /tmp/wkhtmltox.tar.xv -C /opt && rm -f /tmp/wkhtmltox.tar.xv
ENV WKHTMLTOPDF_BIN /opt/wkhtmltox/bin/wkhtmltopdf

# Begin python festivities
COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install functools32 \
  && pip install -r /tmp/requirements.txt

COPY . /aleph
WORKDIR /aleph
ENV ALEPH_SETTINGS /aleph/contrib/docker_settings.py
RUN pip install -e /aleph && pip install https://github.com/pudo/extractors/tarball/master
RUN bower --allow-root install
