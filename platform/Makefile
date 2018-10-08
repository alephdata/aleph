TAG=latest

all: push

build:
	docker build -t alephdata/aleph-base:$(TAG) base
	docker build -t alephdata/aleph-elasticsearch:$(TAG) elasticsearch

run: build
	docker run -ti alephdata/aleph-base:$(TAG) bash

push: build
	docker push alephdata/aleph-base:$(TAG)
	docker push alephdata/aleph-elasticsearch:$(TAG)
