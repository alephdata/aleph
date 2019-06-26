
all: test

build:
	docker build -t alephdata/recognize-text .

test: build
	docker run -ti alephdata/recognize-text pytest

shell: build
	docker run -v $(PWD):/service -ti alephdata/recognize-text sh

run: build
	docker run -ti -p 50000:50000 alephdata/recognize-text