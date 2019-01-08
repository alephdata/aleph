
all: test

build:
	docker build -t alephdata/aleph-convert-document .

test: build
	docker run -ti alephdata/aleph-convert-document pytest

shell: build
	docker run -ti alephdata/aleph-convert-document sh

run: build
	docker run -ti alephdata/aleph-convert-document