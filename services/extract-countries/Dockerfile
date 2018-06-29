FROM python:3.6-stretch

RUN wget -O /tmp/countries.zip http://download.geonames.org/export/dump/allCountries.zip
RUN mkdir /service

ADD setup.py service.py /service/
RUN pip install -q -e /service

HEALTHCHECK --interval=10s --timeout=2s --start-period=4s --retries=3 \
    CMD curl --fail http://localhost:50000 || exit 1

EXPOSE 50000
CMD ["python", "/service/service.py"]
