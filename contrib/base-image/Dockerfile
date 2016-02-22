FROM python:2.7.10
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive

RUN echo "deb http://http.us.debian.org/debian stable non-free" >/etc/apt/sources.list.d/nonfree.list
RUN apt-get update -qq && apt-get install -y -q --no-install-recommends \
        curl git python-pip python-virtualenv build-essential python-dev \
        libxml2-dev libxslt1-dev libpq-dev apt-utils ca-certificates less \
        postgresql-client-9.4 unrar unzip locales libreoffice \
        libreoffice-writer libreoffice-draw libreoffice-impress \
        libreoffice-pdfimport hyphen-hr hyphen-ro hyphen-de mythes-cs \
        mythes-hu tesseract-ocr tesseract-ocr-bel tesseract-ocr-aze \
        tesseract-ocr-osd imagemagick-common imagemagick unoconv \
        libtesseract-dev ruby-sass wkhtmltopdf \
        tesseract-ocr-ces tesseract-ocr-eng tesseract-ocr-deu \
        tesseract-ocr-hrv tesseract-ocr-hun tesseract-ocr-rus \
        tesseract-ocr-pol tesseract-ocr-slk tesseract-ocr-slv \
        tesseract-ocr-sqi tesseract-ocr-srp tesseract-ocr-tur \
        tesseract-ocr-ukr poppler-utils poppler-data antiword \
        unrtf pstotext zlib1g-dev python-numpy default-jdk \
  && apt-get clean

# GB Land registry parser
RUN echo "en_GB ISO-8859-1" >> /etc/locale.gen && \
    echo "en_GB.ISO-8859-15 ISO-8859-15" >> /etc/locale.gen && \
    echo "en_GB.UTF-8 UTF-8" >> /etc/locale.gen && \
    echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen

RUN pip install psycopg2 lxml numpy

RUN curl --silent --location https://deb.nodesource.com/setup_0.12 | sh
RUN apt-get install --yes nodejs && curl -L https://www.npmjs.org/install.sh | sh
RUN npm install -g bower uglifyjs

RUN wget -O /tmp/wkhtmltox.tar.xv http://download.gna.org/wkhtmltopdf/0.12/0.12.3/wkhtmltox-0.12.3_linux-generic-amd64.tar.xz \
    && tar -xf /tmp/wkhtmltox.tar.xv -C /opt && rm -f /tmp/wkhtmltox.tar.xv
