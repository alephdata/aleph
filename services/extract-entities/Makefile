
all: test

# docker build --cache-from alephdata/aleph-extract-entities \
# 	-t alephdata/aleph-extract-entities .
build:	
	docker build -t alephdata/aleph-extract-entities .

test: build
	docker run -ti alephdata/aleph-extract-entities pytest

run: build
	docker run -ti -p 50000:50000 alephdata/aleph-extract-entities

shell: build
	docker run -ti alephdata/aleph-extract-entities bash