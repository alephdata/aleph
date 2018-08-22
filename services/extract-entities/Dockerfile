FROM ubuntu:18.04
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq -y update \
    && apt-get -qq -y install python3-pip python3-icu python3-numpy curl locales \
    && apt-get -qq -y autoremove && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set up the locale and make sure the system uses unicode for the file system.
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    sed -i -e 's/# en_GB.ISO-8859-15 ISO-8859-15/en_GB.ISO-8859-15 ISO-8859-15/' /etc/locale.gen && \
    locale-gen

ENV LANG='en_US.UTF-8' LANGUAGE='en_US:en' LC_ALL='en_US.UTF-8'

RUN pip3 install -U six pip regex==2017.4.5 pycld2==0.31 polyglot==16.7.4 Morfessor==2.0.4
RUN mkdir -p /data/polyglot
ENV POLYGLOT_DATA_PATH=/data/polyglot
# cf. http://polyglot.cs.stonybrook.edu/~polyglot/index.json
# Skipped languages (because their overall support in aleph is not given):
# ner2.hi embeddings2.hi ner2.vi embeddings2.vi
# ner2.ja embeddings2.ja ner2.ko embeddings2.ko ner2.zh embeddings2.zh
RUN polyglot download ner2.it embeddings2.it ner2.fr embeddings2.fr ner2.es embeddings2.es ner2.ar embeddings2.ar
RUN polyglot download ner2.bg embeddings2.bg ner2.no embeddings2.no ner2.et embeddings2.et ner2.el embeddings2.el 
RUN polyglot download ner2.sr embeddings2.sr ner2.fi embeddings2.fi ner2.sl embeddings2.sl ner2.th embeddings2.th
RUN polyglot download ner2.ca embeddings2.ca ner2.hr embeddings2.hr ner2.nl embeddings2.nl ner2.ru embeddings2.ru
RUN polyglot download ner2.sv embeddings2.sv ner2.tl embeddings2.tl ner2.da embeddings2.da ner2.hu embeddings2.hu
RUN polyglot download ner2.lv embeddings2.lv ner2.uk embeddings2.uk ner2.ro embeddings2.ro ner2.tr embeddings2.tr 
RUN polyglot download ner2.fa embeddings2.fa ner2.sk embeddings2.sk ner2.pt embeddings2.pt ner2.lt embeddings2.lt
RUN polyglot download ner2.en embeddings2.en ner2.ms embeddings2.ms ner2.pl embeddings2.pl ner2.id embeddings2.id 
RUN polyglot download ner2.de embeddings2.de ner2.cs embeddings2.cs ner2.he embeddings2.he 

ENV GEONAMES_RAW_PATH='/data/allCountries.filtered.txt' \
    GEONAMES_DB_PATH='/data/geonamesdb'
RUN curl -s -o /tmp/allCountries.zip http://download.geonames.org/export/dump/allCountries.zip \
    && zgrep "ADM1\|PCLI\|PCLD\|PPLC\|PPLA" /tmp/allCountries.zip >${GEONAMES_RAW_PATH} \
    && rm /tmp/allCountries.zip

RUN pip3 install spacy
RUN python3 -m spacy download en && python3 -m spacy download de
RUN python3 -m spacy download es && python3 -m spacy download pt
RUN python3 -m spacy download fr && python3 -m spacy download it
RUN python3 -m spacy download nl
# && python3 -m spacy download xx

RUN mkdir -p /service
WORKDIR /service
ADD requirements.txt /service/
RUN pip3 install -q -r /service/requirements.txt
COPY . /service/
RUN pip3 install -e /service

RUN python3 /service/entityextractor/prepare_geonames.py
USER nobody:nogroup
EXPOSE 50000
CMD ["python3", "/service/entityextractor/service.py"]