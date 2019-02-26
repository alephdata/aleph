# Changelog

This file is intended to make easier for operators of Aleph instances to follow
the development and perform upgrades to their local installation.

## 3.0.0

The goal of `aleph` 3.0.0 is to harmonise the handling of data inside the index.
Instead of having different formats and mappings for documents, entities, table
rows and document pages, there is now just one type of index object: an entity.

This means that document-based data is now completely 'translated' to the
`followthemoney` ontology used by `aleph` (meaning that in theory, each page of
a document and each row of a table is now a node in the object graph of the
`aleph` platform).

### Upgrading

In order to accomplish this, a complete re-index is required in all cases. The
recommended path of migrating from a 2.x.x installation is this set of commands
in an aleph container shell (`make shell`):

```bash
# Re-create the indexes:
aleph resetindex
# Apply a database schema change:
aleph upgrade
# Re-index collections and documents:
aleph repair --documents
```

Be advised that any data loaded via the entity mapping mechanism will need to
be re-loaded after this. It is also worth noting that at OCCRP, we have now
started generating mapped data via the `followthemoney` command-line tool, and
are using `alephclient` to bulk-load the resulting stream of entities into the
system. This has proven to be significantly quicker than the built-in mapping
process.

### Other changes

* Settings `ALEPH_REDIS_URL` and `ALEPH_REDIS_EXPIRE` are now `REDIS_URL` and
  `REDIS_EXPIRE`.
* Variable `ALEPH_OCR_VISION_API` is now `OCR_VISION_API`, it will enable use of
  the Google Vision API for optical character recognition.
* The `/api/2/collections/<id>/ingest` API now only accepts a single file, or
  no file (which will create a folder). The response body contains only the ID
  of the generated document. The status code on success is now 201, not 200.