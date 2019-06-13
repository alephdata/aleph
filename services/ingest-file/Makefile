DOCKER=docker-compose run --rm shell 
IMAGE=alephdata/ingest-file
TAG=latest

build:
	docker build -t $(IMAGE):$(TAG) .

push:
	docker push $(IMAGE):$(TAG)

shell: build
	$(DOCKER) bash

worker: build
	docker-compose run --rm worker

lint: ## check style with flake8
	$(DOCKER) flake8 ingestors tests

test: build ## run tests quickly with the default Python
	$(DOCKER) sh -c "pip install /ingestors && nosetests --with-coverage --cover-package=ingestors"

stop:
	docker-compose down --remove-orphans

dist: ## builds source and wheel package
	$(DOCKER) python3 setup.py sdist bdist_wheel

clean:
	rm -fr dist/

.PHONY: dist build test shell clean worker