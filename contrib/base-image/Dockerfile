FROM python:2.7.10
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update -qq && apt-get install -y -q --no-install-recommends \
        curl git python-pip python-virtualenv build-essential python-dev \
        libxml2-dev libxslt1-dev libpq-dev apt-utils ca-certificates less \
        postgresql-client-9.4 unrar-free unzip locales libreoffice \
        libreoffice-l10n-en-gb libreoffice-help-tr libreoffice-help-ru \
        libreoffice-l10n-hu libreoffice-l10n-hr libreoffice-l10n-uk \
        libreoffice-pdfimport hyphen-hr hyphen-ro hyphen-de mythes-cs \
        mythes-hu tesseract-ocr tesseract-ocr-bel tesseract-ocr-aze \
        tesseract-ocr-ces tesseract-ocr-eng tesseract-ocr-deu \
        tesseract-ocr-hrv tesseract-ocr-hun tesseract-ocr-rus \
        tesseract-ocr-pol tesseract-ocr-slk tesseract-ocr-slv \
        tesseract-ocr-sqi tesseract-ocr-srp tesseract-ocr-tur \
        tesseract-ocr-ukr poppler-utils poppler-data antiword \
        unrtf pstotext zlib1g-dev python-numpy \
  && apt-get clean && apt-get autoremove -y -q

# GB Land registry parser
RUN echo "en_GB ISO-8859-1" >> /etc/locale.gen && \
    echo "en_GB.ISO-8859-15 ISO-8859-15" >> /etc/locale.gen && \
    echo "en_GB.UTF-8 UTF-8" >> /etc/locale.gen && \
    echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen

RUN pip install psycopg2 lxml
