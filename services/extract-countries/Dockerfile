FROM python:3.6-stretch

RUN wget -O /tmp/countries.zip http://download.geonames.org/export/dump/allCountries.zip
RUN mkdir /service

ADD setup.py service.py /service/
RUN pip install -q -e /service

COPY alephclient /alephclient
RUN pip install -U /alephclient

EXPOSE 50000
CMD ["python", "/service/service.py"]
