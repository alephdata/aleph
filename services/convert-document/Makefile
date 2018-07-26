
all: test

build:
	docker build --cache-from alephdata/aleph-convert-document \
		-t alephdata/aleph-convert-document .

test: build
	docker run -ti alephdata/aleph-convert-document pytest

run: build
	docker run -ti alephdata/aleph-convert-document