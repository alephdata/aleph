FROM ubuntu:19.04
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq -y update \
    && apt-get -q -y install locales python3-pip tesseract-ocr-eng python3-tesserocr python3-grpcio python3-icu \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN apt-get -qq -y update \
    && apt-get -q -y install \
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
        tesseract-ocr-frm \
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

RUN groupadd -r app \
    && useradd -r -s /bin/false -g app app \
    && mkdir -p /home/app \
    && chown -R app:app /home/app
ENV LANG=C
ENV LC_ALL=C
ENV OMP_THREAD_LIMIT=1
RUN mkdir -p /service
WORKDIR /service
COPY setup.py /service/
RUN pip3 install --no-cache-dir -q -e /service
COPY . /service/

USER app
EXPOSE 50000
CMD ["python3", "/service/textrecognizer/service.py"]
