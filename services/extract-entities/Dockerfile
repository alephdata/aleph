FROM ubuntu:18.04
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq -y update \
    && apt-get -qq -y install python3-pip python3-icu curl locales \
    && apt-get -qq -y autoremove && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set up the locale and make sure the system uses unicode for the file system.
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    sed -i -e 's/# en_GB.ISO-8859-15 ISO-8859-15/en_GB.ISO-8859-15 ISO-8859-15/' /etc/locale.gen && \
    locale-gen

ENV LANG='en_US.UTF-8' \
    LANGUAGE='en_US:en' \
    LC_ALL='en_US.UTF-8'

RUN pip3 install -U six pip \
                    regex==2017.4.5 \
                    pycld2==0.31 \
                    normality \
                    polyglot==16.7.4 \
                    Morfessor==2.0.4 \
                    numpy==1.14.3 \
                    spacy \
    && rm -rf /root/.cache

RUN mkdir /data
ENV POLYGLOT_DATA_PATH=/data
RUN polyglot download TASK:ner2
RUN polyglot download TASK:embeddings2

RUN python3 -m spacy download en
RUN python3 -m spacy download de
RUN python3 -m spacy download es
RUN python3 -m spacy download pt
RUN python3 -m spacy download fr
RUN python3 -m spacy download it
RUN python3 -m spacy download nl
RUN python3 -m spacy download xx


RUN mkdir -p /service
WORKDIR /service
ADD requirements.txt /service/
RUN pip3 install -q -r /service/requirements.txt
COPY . /service/
RUN pip3 install -e /service

HEALTHCHECK --interval=10s --timeout=2s --start-period=4s --retries=3 \
    CMD curl --fail http://localhost:50000 || exit 1

EXPOSE 50000
CMD ["python3", "/service/entityextractor/service.py"]