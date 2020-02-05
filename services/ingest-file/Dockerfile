FROM ubuntu:19.10
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq -y update \
    && apt-get -q -y upgrade \
    && apt-get -q -y install \
        tesseract-ocr-eng \
        tesseract-ocr-swa \
        tesseract-ocr-swe \
        # tesseract-ocr-tam \
        # tesseract-ocr-tel \
        # tesseract-ocr-tgl \
        # tesseract-ocr-tha \
        tesseract-ocr-tur \
        tesseract-ocr-ukr \
        # tesseract-ocr-vie \
        tesseract-ocr-nld \
        tesseract-ocr-nor \
        tesseract-ocr-pol \
        tesseract-ocr-por \
        tesseract-ocr-ron \
        tesseract-ocr-rus \
        tesseract-ocr-slk \
        tesseract-ocr-slv \
        tesseract-ocr-spa \
        # tesseract-ocr-spa_old \
        tesseract-ocr-sqi \
        tesseract-ocr-srp \
        tesseract-ocr-ind \
        tesseract-ocr-isl \
        tesseract-ocr-ita \
        # tesseract-ocr-ita_old \
        # tesseract-ocr-jpn \
        tesseract-ocr-kan \
        # tesseract-ocr-kor \
        tesseract-ocr-lav \
        tesseract-ocr-lit \
        # tesseract-ocr-mal \
        tesseract-ocr-mkd \
        tesseract-ocr-mlt \
        tesseract-ocr-msa \
        tesseract-ocr-est \
        # tesseract-ocr-eus \
        tesseract-ocr-fin \
        tesseract-ocr-fra \
        tesseract-ocr-frk \
        # tesseract-ocr-frm \
        # tesseract-ocr-glg \
        # tesseract-ocr-grc \
        tesseract-ocr-heb \
        tesseract-ocr-hin \
        tesseract-ocr-hrv \
        tesseract-ocr-hun \
        # tesseract-ocr-ben \
        tesseract-ocr-bul \
        tesseract-ocr-cat \
        tesseract-ocr-ces \
        # tesseract-ocr-chi_sim \
        # tesseract-ocr-chi_tra \
        # tesseract-ocr-chr \
        tesseract-ocr-dan \
        tesseract-ocr-deu \
        tesseract-ocr-ell \
        # tesseract-ocr-enm \
        # tesseract-ocr-epo \
        # tesseract-ocr-equ \
        tesseract-ocr-afr \
        tesseract-ocr-ara \
        tesseract-ocr-aze \
        tesseract-ocr-bel \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Enable non-free archive for `unrar`.
# RUN echo "deb http://http.us.debian.org/debian stretch non-free" >/etc/apt/sources.list.d/nonfree.list
RUN apt-get -qq -y update \
    && apt-get -q -y install build-essential locales ca-certificates \
        # python deps (mostly to install their dependencies)
        python3-pip python3-dev python3-pil \
        # tesseract
        tesseract-ocr libtesseract-dev libleptonica-dev pkg-config\
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
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales \
    && update-locale LANG=en_US.UTF-8
ENV LANG='en_US.UTF-8' \
    LC_ALL='en_US.UTF-8' \
    LC_CTYPE='en_US.UTF-8' \
    TZ='UTC' \
    OMP_THREAD_LIMIT='1'

RUN groupadd -g 1000 -r app \
    && useradd -m -u 1000 -s /bin/false -g app app

RUN pip3 install --no-cache-dir -q -U pip setuptools six wheel nose coverage
COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

# Install spaCy and link models to three-letter language codes
RUN python3 -m spacy download xx_ent_wiki_sm \
    && python3 -m spacy link xx_ent_wiki_sm xx
RUN python3 -m spacy download en_core_web_sm \
    && python3 -m spacy link en_core_web_sm eng
RUN python3 -m spacy download de_core_news_sm \
    && python3 -m spacy link de_core_news_sm deu
RUN python3 -m spacy download fr_core_news_sm \
    && python3 -m spacy link fr_core_news_sm fra
RUN python3 -m spacy download es_core_news_sm \
    && python3 -m spacy link es_core_news_sm spa
RUN python3 -m spacy download pt_core_news_sm \
    && python3 -m spacy link pt_core_news_sm por
ENV INGESTORS_NER_MODELS=eng:deu:fra:spa:por

COPY . /ingestors
WORKDIR /ingestors
RUN pip3 install --no-cache-dir -e /ingestors
RUN chown -R app:app /ingestors

ENV ARCHIVE_TYPE=file \
    ARCHIVE_PATH=/data \
    BALKHASH_BACKEND=postgresql \
    BALKHASH_DATABASE_URI=postgresql://aleph:aleph@postgres/aleph \
    REDIS_URL=redis://redis:6379/0 \
    INGESTORS_CONVERT_DOCUMENT_URL=http://convert-document:3000/convert

# USER app
CMD ingestors process