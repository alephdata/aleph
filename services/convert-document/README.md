# convert-document

A docker container environment to bundle the execution of `LibreOffice` to convert documents of various types (such as Word, OpenDocument, etc.) to PDF. An instance of `LibreOffice` will be run in the background, and controlled via a local socket (i.e. the UNO protocol).

## Usage

This service is intended for use exclusively as a docker container. While it may be possible to
run this application stand-alone, this is not recommended. For normal usage, you should pull the
latest stable image off DockerHub and run it like this:

```shell
docker pull alephdata/convert-document
docker run -p 3000:3000 -ti alephdata/convert-document
```

Once the service has initialised, files can be sent to the `/convert` endpoint, and a PDF version
will be returned as a download:

```shell
curl -o out.pdf -F format=pdf -F 'file=@mydoc.doc' http://localhost:3000/convert
```

## Development

To build, run:

```shell
docker build --rm -t alephdata/convert-document .
```

To get a development shell:

```shell
make shell
```

Forced restart

```shell
make build && docker-compose -f docker-compose.dev.yml stop convert-document && docker-compose -f docker-compose.dev.yml up -d convert-document
```
