
all: test

build:
	docker build -t alephdata/aleph-recognize-text .

test: build
	docker run -ti alephdata/aleph-recognize-text pytest

run: build
	docker run -ti alephdata/aleph-recognize-text