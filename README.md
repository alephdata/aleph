# aleph

``aleph`` is a tool for indexing large amounts of both unstructured (PDF, Word, HTML) and structured (CSV, XLS, SQL) data for easy browsing and search. It is built with investigative reporting as a primary use case. ``aleph`` allows cross-referencing mentions of well-known entities (people and companies) against watchlists, e.g. from prior research or public datasets.

Here's some key features:

* Web-based UI for search across large document and data sets (AngularJS and PDF.js).
* Equal support for structured (i.e. tabular) and unstructured (i.e. textual) sources.
* Importers include a local filesystem traverser, web crawlers and a SQL query importer.
* Document entity tagger (regular expressions-based, exploring NLP options).
* Support for OCR, unpacking Zip/RAR/Tarballs, language and encoding detection.
* Entity watchlist importers for [OpenNames](http://pudo.org/material/opennames/), 
  [OCCRP Spindle](http://github.com/occrp/spindle/).
* OAuth authorization and access control on a per-source and per-watchlist basis.
* Excel export for result lists for researchers.
* Ability to generate graph representations of entity co-occurrence.


## Use cases

* As a journalist, I want to combine different types of facets which
  represent document and entity metadata.
* As a journalist, I want to see a list of documents that mention
  a person/org/topic so that I can sift through the documents.
* As a journalist, I want to intersect sets of documents that mention multiple
  people/orgs/topics so that I can drill down on the relationships between them. 
* As a data importer, I want to routinely crawl and import documents
  from many data sources, including web scrapers, structured sources and filesystems. 
* As a data importer, I want to associate metadata with documents
  and entities so that users can browse by various facets. 


## Basic ideas

* Each imported document is either tabular or textual. It has many records, i.e. data rows
  or document pages.
* An entity (such as a person, organisation, or topic) is like a permanent search query;
  each entity can have multiple actual search terms associated with it (``selectors``).
* Documents matching an entity after that entity has been created yield notifications if
  a user is subscribed.


## Installation

As aleph has multiple external dependencies, it is strongly recommended to deploy the package
in a containerized setup via ``docker`` and ``docker-compose``. After [installing both of these](https://docs.docker.com/compose/install/), you can deploy a simple version of aleph like this:

```bash
$ git clone git@github.com:pudo/aleph.git
$ cd aleph
$ cp aleph.env.tmpl aleph.env
# edit the environment settings
$ docker-compose up
```

This will launch containers for PostgreSQL, ElasticSearch, RabbitMQ as well as for the applications
front- and backend.

## Existing tools

* [DocumentCloud](https://github.com/documentcloud)
* [ICIJ Extract](https://github.com/icij/extract)
* [Transparency Toolkit](https://github.com/TransparencyToolkit)
* [resourcecontracts.org](https://github.com/developmentseed/rw-contracts)
* [mma-dexter](https://github.com/Code4SA/mma-dexter)
* [analice.me](https://github.com/hhba/mapa76)
* [datawi.re](https://github.com/pudo/datawi.re)
* [nltk](http://www.nltk.org/), [patterns](http://www.clips.ua.ac.be/pattern)
* [OpenCalais](http://www.opencalais.com/), LingPipe, AlchemyAPI

## License

``aleph`` is licensed under a standard MIT license (included as ``LICENSE``).

