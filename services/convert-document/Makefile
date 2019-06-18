
all: test

build:
	docker build -t alephdata/convert-document .

test: build
	docker run -ti alephdata/convert-document pytest

shell: build
	docker run -ti alephdata/convert-document bash

run: build
	docker run -p 3000:3000 -ti alephdata/convert-document