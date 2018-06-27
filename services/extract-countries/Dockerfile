FROM python:3.6-stretch

RUN wget -O /tmp/countries.zip http://download.geonames.org/export/dump/allCountries.zip
RUN mkdir /service
COPY service.py /service
