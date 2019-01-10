# LibreOffice PDF generator service

A docker container environment to bundle the execution of `unoconv`, a command-line utility that uses `LibreOffice` to convert documents of various types (such as Word, OpenDocument, etc.) to PDF.

An instance of `LibreOffice` will be run in the background, and controlled via a local socket (i.e. the UNO protocol).

To build, run:

```shell
$ docker build --rm -t alephdata/aleph-convert-document .
```

To start the container, run:

```shell
docker run -p 3000:3000 --mount type=tmpfs,destination=/tmp -ti alephdata/aleph-convert-document
```

Or, to get a development shell:

```shell
docker run --rm -v $(PWD)/unoservice:/unoservice/unoservice -v $(PWD)/fixtures:/unoservice/fixtures --mount type=tmpfs,destination=/tmp --mount type=tmpfs,destination=/root/.config -ti alephdata/unoservice /bin/bash
```

Now, files can be sent to the service:

```shell
curl -o out.pdf -F format=pdf -F 'file=@mydoc.doc' http://localhost:3000/convert
```

```shell
make build && docker-compose -f docker-compose.dev.yml stop convert-document && docker-compose -f docker-compose.dev.yml up -d convert-document
```
