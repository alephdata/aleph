

build:
	docker build -t alephdata/aleph-extract-entities .

test: build
	docker run -ti alephdata/aleph-extract-entities pytest

run: build
	docker run -ti alephdata/aleph-extract-entities