FROM alpine

# Not using Python image because this is smaller
RUN apk update && apk upgrade && \
    apk add --no-cache python3 libstdc++

# Install Python binary builds
RUN apk add --no-cache --virtual=build_deps python3-dev g++ gfortran && \
    pip3 install --no-cache-dir spacy==2.0.18 grpcio==1.17.1 alephclient==0.10.0 && \
    apk del build_deps

# Download spaCy models
RUN python3 -m spacy download xx

RUN mkdir -p /service
WORKDIR /service
ADD setup.py /service/
ADD entityextractor/ /service/entityextractor
RUN pip3 install -e /service

EXPOSE 50000
CMD ["python3", "/service/entityextractor/service.py"]
