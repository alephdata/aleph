
all: test

build:
	docker build --cache-from alephdata/aleph-extract-entities \
		-t alephdata/aleph-extract-entities .

test: build
	docker run -ti alephdata/aleph-extract-entities pytest

run: build
	docker run -ti alephdata/aleph-extract-entities