FROM alpine:3.9

# Not using Python image because this is smaller
RUN apk update && apk upgrade && \
    apk add --no-cache tesseract-ocr

RUN apk add --no-cache tesseract-ocr-data-swa \
    tesseract-ocr-data-swe \
    # tesseract-ocr-data-tam \
    # tesseract-ocr-data-tel \
    # tesseract-ocr-data-tgl \
    # tesseract-ocr-data-tha \
    tesseract-ocr-data-tur \
    tesseract-ocr-data-ukr \
    # tesseract-ocr-data-vie \
    tesseract-ocr-data-nld \
    tesseract-ocr-data-nor \
    tesseract-ocr-data-pol \
    tesseract-ocr-data-por \
    tesseract-ocr-data-ron \
    tesseract-ocr-data-rus \
    tesseract-ocr-data-slk \
    tesseract-ocr-data-slv \
    tesseract-ocr-data-spa \
    # tesseract-ocr-data-spa_old \
    tesseract-ocr-data-sqi \
    tesseract-ocr-data-srp \
    tesseract-ocr-data-ind \
    tesseract-ocr-data-isl \
    tesseract-ocr-data-ita \
    # tesseract-ocr-data-ita_old \
    # tesseract-ocr-data-jpn \
    tesseract-ocr-data-kan \
    # tesseract-ocr-data-kor \
    tesseract-ocr-data-lav \
    tesseract-ocr-data-lit \
    # tesseract-ocr-data-mal \
    tesseract-ocr-data-mkd \
    tesseract-ocr-data-mlt \
    tesseract-ocr-data-msa \
    tesseract-ocr-data-est \
    # tesseract-ocr-data-eus \
    tesseract-ocr-data-fin \
    tesseract-ocr-data-fra \
    tesseract-ocr-data-frk \
    tesseract-ocr-data-frm \
    # tesseract-ocr-data-glg \
    # tesseract-ocr-data-grc \
    tesseract-ocr-data-heb \
    tesseract-ocr-data-hin \
    tesseract-ocr-data-hrv \
    tesseract-ocr-data-hun \
    # tesseract-ocr-data-ben \
    tesseract-ocr-data-bul \
    tesseract-ocr-data-cat \
    tesseract-ocr-data-ces \
    # tesseract-ocr-data-chi_sim \
    # tesseract-ocr-data-chi_tra \
    # tesseract-ocr-data-chr \
    tesseract-ocr-data-dan \
    tesseract-ocr-data-deu \
    tesseract-ocr-data-ell \
    # tesseract-ocr-data-enm \
    # tesseract-ocr-data-epo \
    tesseract-ocr-data-equ \
    tesseract-ocr-data-afr \
    tesseract-ocr-data-ara \
    tesseract-ocr-data-aze \
    tesseract-ocr-data-bel

RUN apk add --no-cache python3 py3-pillow py3-icu libstdc++
RUN pip3 install --no-cache-dir --upgrade pip

# Install Python binary builds
RUN apk add --no-cache --virtual=build_deps python3-dev g++ tesseract-ocr-dev cython-dev ca-certificates && \
    pip3 install --no-cache-dir tesserocr normality grpcio protobuf && \
    apk del build_deps

ENV LANG=C
ENV LC_ALL=C
ENV OMP_THREAD_LIMIT=1
RUN mkdir -p /service
WORKDIR /service
COPY setup.py /service/
RUN pip3 install --no-cache-dir -q -e /service
COPY . /service/

# USER nobody:nogroup
EXPOSE 50000
CMD ["python3", "/service/textrecognizer/service.py"]
