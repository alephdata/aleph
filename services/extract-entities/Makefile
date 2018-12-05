
all: build

build:
	docker build -t alephdata/aleph-extract-entities .

shell: build
	docker run -v $(PWD):/service -ti alephdata/aleph-extract-entities sh

run: build
	docker run -ti -p 50000:50000 alephdata/aleph-extract-entities