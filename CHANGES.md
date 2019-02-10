# Aleph Changelog

This file is intended to make easier for operators of Aleph instances to follow
the development and perform upgrades to their local installation.

## 2.4.0

* Settings `ALEPH_REDIS_URL` and `ALEPH_REDIS_EXPIRE` are now `REDIS_URL` and
  `REDIS_EXPIRE`.
* Variable `ALEPH_OCR_VISION_API` is now `OCR_VISION_API`, it will enable use of
  the Google Vision API for optical character recognition.
* The `/api/2/collections/<id>/ingest` API now only accepts a single file, or
  no file (which will create a folder). The response body contains only the ID
  of the generated document. The status code on success is now 201, not 200.