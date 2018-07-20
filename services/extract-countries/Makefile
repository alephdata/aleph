
all: run

build:
	docker build --cache-from alephdata/aleph-extract-countries \
		-t alephdata/aleph-extract-countries .

# test: build
# 	docker run -ti alephdata/aleph-extract-countries pytest

run: build
	docker run -ti alephdata/aleph-extract-countries