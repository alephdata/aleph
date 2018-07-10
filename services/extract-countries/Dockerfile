FROM python:3.6-stretch

RUN apt-get -qq -y update \
    && apt-get -qq -y install build-essential python-dev libicu-dev \
    && apt-get -qq -y autoremove && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN wget -q -O /tmp/allCountries.zip http://download.geonames.org/export/dump/allCountries.zip
RUN mkdir /service

ADD setup.py /service/
RUN pip install -q -e /service
ADD service.py /service/

HEALTHCHECK --interval=10s --timeout=2s --start-period=4s --retries=3 \
    CMD curl --fail http://localhost:50000 || exit 1

EXPOSE 50000
CMD ["python", "/service/service.py"]
