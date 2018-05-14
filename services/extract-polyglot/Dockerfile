FROM alephdata/platform-polyglot

RUN pip install grpcio==1.11.0 
ADD aleph /service/aleph
ADD setup.py service.py /service/
RUN pip install -q -e /service
EXPOSE 50000
CMD ["python", "/service/service.py"]