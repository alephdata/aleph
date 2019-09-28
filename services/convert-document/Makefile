
build:
	docker build --cache-from alephdata/convert-document -t alephdata/convert-document .

test: build
	docker run -ti alephdata/convert-document pytest

shell: build
	docker run -ti -v $(PWD):/convert -p 3000:3000 alephdata/convert-document bash

run: build
	docker run -p 3000:3000 -ti alephdata/convert-document

test:
	curl -o out.pdf -F format=pdf -F 'file=@fixtures/agreement.docx' http://localhost:3000/convert