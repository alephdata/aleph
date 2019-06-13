# recognize-text

This is a service container that performs OCR on images submitted as a byte stream by using
`tesseract` 4.0. The input should specify the language, if possible, so the right type of
script detection can be used.

Images submitted via the API should be limited to less than 4 MiB in size, if possible, to
avoid problems with the gRPC protocol.

## Usage

In order to use this OCR container, you need to use the same protocol buffer specifications
active on the server. The simplest way to use them would be via the `servicelayer` Python
library, but the protocol can also be used independently.

Check out the following client code to see how `recognize-text` is used:

https://github.com/alephdata/servicelayer/blob/master/servicelayer/rpc/__init__.py

You can also inspect the protocol buffer files directly here:

https://github.com/alephdata/servicelayer/tree/master/protos/servicelayer/rpc

The container itself can be pulled from the DockerHub and will expose a service on port
`50000`:

```shell
docker pull alephdata/recognize-text
docker run -p 50000:50000 -ti alephdata/recognize-text
```
