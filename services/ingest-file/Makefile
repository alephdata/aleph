IMAGE=alephdata/ingest-file
TAG=latest

build:
	docker build -t $(IMAGE):$(TAG) .

push:
	docker push $(IMAGE):$(TAG)

.PHONY: build push
