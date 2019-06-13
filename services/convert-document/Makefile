
all: test

build:
	docker build -t alephdata/convert-document .

test: build
	docker run -ti alephdata/convert-document pytest

shell: build
	docker run -ti alephdata/convert-document sh

run: build
	docker run -ti alephdata/convert-document