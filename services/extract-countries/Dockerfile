FROM ubuntu:18.04
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq -y update \
    && apt-get -qq -y install python3-icu python3-pip wget \
    && apt-get -qq -y autoremove && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN wget -q -O /tmp/allCountries.zip http://download.geonames.org/export/dump/allCountries.zip \
    && zgrep "ADM1\|PCLI" /tmp/allCountries.zip >/tmp/allCountries.filtered.txt \
    && rm /tmp/allCountries.zip

RUN mkdir /service
WORKDIR /service
ADD setup.py /service/
RUN pip3 install -q -e /service
ADD service.py /service/

HEALTHCHECK --interval=10s --timeout=2s --start-period=4s --retries=3 \
    CMD curl --fail http://localhost:50000 || exit 1

EXPOSE 50000
CMD ["python3", "/service/service.py"]
