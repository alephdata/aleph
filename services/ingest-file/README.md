# ingestors

[![Build Status](https://travis-ci.org/alephdata/ingestors.svg?branch=master)](https://travis-ci.org/alephdata/ingestors)

``ingestors`` extract useful information from documents of different types in
a structured standard format. It retains folder structures across directories,
compressed archives and emails.

Supported file types:

* Plain text
* Images
* Web pages, XML documents
* PDF files
* Emails (Outlook, plain text)
* Archive files (ZIP, Rar, etc.)

Other features:

* Extendable and composable using classes and mixins.
* Serializable results object with basic metadata support.
* Lightweight worker-style support for logging, failures and callbacks.
* Throughly tested.

## Installation

To install ``ingestors``, use `pip` or add it to your project dependencies.

```shell
$ pip install ingestors[dev]
```

Once installed, this package provides a command line tool::

```shell
$ python -m ingestors.cli <PATH TO YOUR FILE>
```

This tool will print the JSON formatted results.

```shell
$ python -m ingestors.cli tests/fixtures/image.svg
{
    "authors": [],
    "checksum": "a0233ebbf9d64a0adf1ddf13be248cd48c2ad69f",
    "content": "Testing ingestors 1..2..3..",
    "file_size": 15969,
    "mime_type": "image/svg+xml",
    "order": 0,
    "title": "image.svg"
}
```

There's a simple API you can use.

```python
from ingestors import Manager

result = Manager({}).ingest(file_path)
print result.to_dict()
```

## Documentation

Ingestors operate on files and folders. And while some files represent a single
document, some file types include multiple documents, some of which of
different type.

A good example is an email file type. While the document is composed of a
subject and a body with address fields, it can also have attachments.

### Architecture

Because of this, an the processing of documents is composed of three parts: one
is the file type specific part to extract the information, the ingestor. It
will be chosen based on the input file type. The second part, the result, is
used by the ingestor to output the data it has extracted. Finally, a manager
component takes care of spawning child ingestors, selecting the right ingestor
for a given file type, as well as various other process-related tasks.

### Example

Any newly spawned ingestor will keep a reference to its parent by being
provided a file  value besides other context information.

Running an ingestor on the `archive.zip` will generate an checksum of the file
to be used as an identifier. Next it will extract the files and try to spawn a
new ingestor with the reference to the `archive.zip` instance. And so on with
every next file.

The ingestor offers support for iterating on all the children it discovered.

An example would be:

```python
for child in result.children:
    print child.checksum, child.file_name
```

### Statuses

An ingestor can be in one of the statuses:

* *success*, indicates the ingestor finished processing the file successfully
* *failure*, indicates the ingestor finished processing the file with an error
* *stopped*, indicates the ingestor was stopped externally or internally
  (system errors, OS limitations, etc.)

Along with the statuses, an ingestor having spawned children, provides
information the number of children and their status.

### Events

An ingestor provides callbacks in the form of:

* `before()`, to be called before the file processing is started. This callback
  is provided with the context of the file to be processed (checksum information,
  filename, time it started, status etc.)
* `after()`, to be called after the file processing is done. This callback is
  provided with the context of the processed file and the results (spawned
  children, time it ended, status, etc.)

Any of these callbacks can be overwritten to store the context in a persistent
way or be passed on towards additional processing.

### Results

An ingestor does not provide a strict format of the processing results, still,
its result interface provides access to the following extracted data:

* mime type
* file name
* file size
* checksum
* document title (if any)
* document authors (if any)
* pages (for text documents)
* rows (for tabular documents)
