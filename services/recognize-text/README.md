# recognize-text

This is a microservice that performs OCR on images submitted as
a byte stream using tesseract.

## Questions

* Can we actually send any image via gRPC as a byte stream?
  Apparently the protocol breaks down somewhere around 4MB of
  request size.

## Switching to tesseract 4

* https://launchpad.net/~alex-p/+archive/ubuntu/tesseract-ocr
