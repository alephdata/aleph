TAG=latest

all: push

build:
	docker build -t alephdata/aleph-base:$(TAG) base

run: build
	docker run -ti alephdata/aleph-base:$(TAG) bash

push: build
	docker push alephdata/aleph-base:$(TAG)
