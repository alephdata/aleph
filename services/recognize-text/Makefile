
all: test

build:
	docker build --cache-from alephdata/aleph-recognize-text \
		-t alephdata/aleph-recognize-text .

test: build
	docker run -ti alephdata/aleph-recognize-text pytest

shell: build
	docker run -v $(PWD):/service -ti alephdata/aleph-recognize-text bash

run: build
	docker run -ti alephdata/aleph-recognize-text