# aleph [![Build Status](https://api.travis-ci.org/pudo/aleph.png)](https://travis-ci.org/pudo/aleph)

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

## Installation

As aleph has multiple external dependencies (for data processing and conversion), it is
strongly recommended to deploy the package in a containerized setup via ``docker`` and
``docker-compose``. Please follow the relevant documentation on [installing docker-compose](https://docs.docker.com/compose/install/).

You will also need to set up a Google OAuth web application at their [developers console](https://console.developers.google.com/),
and make sure to configure the OAuth callback URL to be ``http(s)://your-install/api/1/sessions/callback``. 

Finally, ``aleph`` is optimized to utilise certain aspects of [Amazons AWS](https://aws.amazon.com) offerings. By
default, it will try to create a bucket for the application's data, and make use of
Amazon SQS for task queueing. If you wish to use AWS, you will need to set the AWS key ID
and access key in the configuration file. Alternatively, plain file system storage and 
RabbitMQ can be used to avoid AWS.

```bash
$ git clone git@github.com:pudo/aleph.git
$ cd aleph
$ cp aleph.env.tmpl aleph.env
# edit the environment settings
$ docker-compose up
$ docker-compose run worker /bin/bash
# init the database (this will also delete it, hence the name):
root@worker# aleph evilshit
```

This will launch containers for PostgreSQL and ElasticSearch as well as for the applications
front- and backend. The application should become available at ``http://localhost:13376``.
You can proxy this port to the public web, or install an HTTP cache to retain static assets.

## Usage

``aleph`` has a number of ways for ingesting data. These are controlled via the command line
utility by the same name, usually from inside the ``worker`` container.

```bash
$ docker-compose run worker /bin/bash
# Load entity watchlists from OpenNames (http://pudo.org/material/opennames):
root@worker# aleph crawl opennames
# Load all files from the given directory:
root@worker# aleph crawldir /srv/data/my_little_documents_folder
# Load data from a metafolder:
root@worker# aleph metafolder /srv/data/scraped.mf
```

## Project coordination

``aleph`` is used by multiple organisations, including Code for Africa, OCCRP and OpenOil. For coordination, the following Google Group exists: 

https://groups.google.com/forum/#!forum/aleph-search

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

