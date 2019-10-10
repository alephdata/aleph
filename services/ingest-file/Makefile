IMAGE=alephdata/ingest-file
TAG=latest

build:
	docker build -t $(IMAGE):$(TAG) .

push:
	docker push $(IMAGE):$(TAG)

upgrade:
	pip install -U -r /ingestors/requirements.in
	pip freeze --exclude-editable | grep -vi pygobject | grep -vi pyxdg >/ingestors/requirements.txt

.PHONY: build push
