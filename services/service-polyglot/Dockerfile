FROM python:3

RUN mkdir -p /data
ENV POLYGLOT_DATA_PATH=/data
RUN apt-get -qq -y update && apt-get -qq -y dist-upgrade \
    && apt-get -qq -y install libicu-dev \
    && apt-get -qq -y autoremove && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN pip install --upgrade six pip
RUN pip install grpcio==1.11.0 \
                regex==2018.2.21 \
                PyICU==2.0.3 \
                pycld2==0.31 \
                normality==0.5.12 \
                polyglot==16.7.4 \
                Morfessor==2.0.4 \
                numpy==1.14.3 \
                alephprotos==0.0.1

RUN polyglot download TASK:ner2
RUN polyglot download TASK:embeddings2

RUN pip install alephprotos==0.0.2
COPY service.py /
EXPOSE 50000
CMD ["/usr/local/bin/python", "/service.py"]