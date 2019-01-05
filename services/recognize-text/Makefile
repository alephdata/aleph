
all: test

build:
	docker build -t alephdata/aleph-recognize-text .

test: build
	docker run -ti alephdata/aleph-recognize-text pytest

shell: build
	docker run -v $(PWD):/service -ti alephdata/aleph-recognize-text sh

run: build
	docker run -ti -p 50000:50000 alephdata/aleph-recognize-text