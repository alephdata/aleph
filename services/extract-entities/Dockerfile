FROM alpine

# Not using Python image because this is smaller
RUN apk update && apk upgrade && \
    apk add --no-cache python3 libstdc++
RUN pip3 install --no-cache-dir --upgrade pip

# Install Python binary builds
RUN apk add --no-cache --virtual=build_deps python3-dev g++ gfortran && \
    pip3 install --no-cache-dir spacy==2.0.18 grpcio==1.11.0 && \
    apk del build_deps

# Download spaCy models
RUN python3 -m spacy download xx

RUN mkdir -p /service
WORKDIR /service
COPY setup.py entityextractor /service/
RUN pip3 install -e /service

EXPOSE 50000
CMD ["python3", "/service/entityextractor/service.py"]
