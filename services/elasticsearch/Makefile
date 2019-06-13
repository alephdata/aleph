TAG=latest

all: push

build:
	docker build -t alephdata/aleph-elasticsearch:$(TAG) .

run: build
	docker run -ti alephdata/aleph-elasticsearch:$(TAG) bash

exec: build
	docker run -ti -v $(PWD)/secrets:/secrets alephdata/aleph-elasticsearch:$(TAG)

push: build
	docker push alephdata/aleph-elasticsearch:$(TAG)
