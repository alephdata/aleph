# aleph [![Build Status](https://api.travis-ci.org/pudo/aleph.png)](https://travis-ci.org/pudo/aleph)

``aleph`` is a tool for indexing large amounts of both unstructured (PDF, Word, HTML) and structured (CSV, XLS, SQL) data for easy browsing and search. It is built with investigative reporting as a primary use case. ``aleph`` allows cross-referencing mentions of well-known entities (such as people and companies) against watchlists, e.g. from prior research or public datasets.

Here's some key features:

* Web-based UI for search across large document and data sets.
* Equal support for structured (i.e. tabular) and unstructured (i.e. textual) sources.
* Importers include a local filesystem traverser, web crawlers and a SQL query importer.
* Document entity tagger (regular expressions-based, exploring NLP options).
* Support for OCR, unpacking Zip/RAR/Tarballs, language and encoding detection.
* Entity watchlist importers for [OpenNames](http://pudo.org/material/opennames/), 
  [OCCRP Spindle](http://github.com/occrp/spindle/).
* OAuth authorization and access control on a per-source and per-watchlist basis.
* Excel export for search result sets.
* Ability to generate graph representations of entity co-occurrence.

## Installation

As ``aleph`` has multiple external dependencies (for data processing and conversion), it is recommended to use ``docker`` containers to run the application in production. This will automatically deploy the required database and search servers (PostgreSQL and ElasticSearch), build tools (bower, uglifyjs, sass) as well as installing the necessary document and data processing tools (such as LibreOffice, Tesseract).

### Using docker

It is strongly recommended to deploy the package in a containerized setup via ``docker`` and ``docker-compose``. Please follow the relevant documentation on [installing docker-compose](https://docs.docker.com/compose/install/).

You will also need to set up a Google OAuth web application at their [developers console](https://console.developers.google.com/), and make sure to configure the OAuth callback URL to be ``http(s)://your-install/api/1/sessions/callback``. 

Finally, ``aleph`` is optimized to utilise certain aspects of [Amazons AWS](https://aws.amazon.com). By default, it will try to create a bucket for the application's data, and make use of Amazon SQS for task queueing. If you wish to use AWS, you will need to set the AWS key ID and access key in the configuration file. Alternatively, plain file system storage and RabbitMQ can be used to avoid AWS.

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

This will launch containers for PostgreSQL and ElasticSearch as well as for the applications front- and backend. The application should become available at ``http://localhost:13376``. You can proxy this port to the public web, or install an HTTP cache to retain static assets (make sure to set ``CACHE = True`` in the settings file.

### Development install

If you do not wish to isolate ``aleph`` using ``docker``, you can of course run the application directly. For this to work, make sure to have the following dependencies installed:

* PostgreSQL newer than 9.4 (with ``JSONB`` column type support), and ElasticSearch 2.2 or newer.
* LibreOffice 4.4 or newer (for document transformation)
* Ruby ``sass`` (``ruby-sass`` on Debian, or ``gem install sass``)
* Node.js, NPM and the packages ``bower`` and ``uglifyjs``
* ``git`` is needed to clone the source code repository

The following packages are strictly optional but enable additional document import and conversion options:

* ImageMagick (``imagemagick`` on Debian and Homebrew)
* A non-free version of ``unrar`` (``unrar`` on Debian and Homebrew)
* Tesseract 3.x with development libraries (``libtesseract-dev`` on Debian, ``tesseract`` on Homebrew), and language packages.
* wkhtmltopdf 0.12 or newer for HTML to PDF conversion.

Once these dependencies are installed, the following environment variables (might) need to be adjusted:

* ``TESSDATA_PREFIX`` must be set for OCR to work at all. This is the path of the ``tesseract`` training files, usually ``/usr/share/tesseract-ocr``.
* ``EXTRACTORS_CACHE_DIR`` will be used to cache OCR results. Set this to a writeable directory to enable caching.
* ``WKHTMLTOPDF_BIN`` to point to the ``wkhtmltopdf`` binary (if not in ``PATH``)
* ``SOFFICE_BIN`` to point to the LibreOffice binary (if not in ``PATH``)
* ``CONVERT_BIN`` to point to the ImageMagick binary (if not in ``PATH``)

Next, you can begin to clone and install ``aleph`` via git (please note that it is strongly recommended to use a Python ``virtualenv`` before installing the Python dependencies, [learn more](http://docs.python-guide.org/en/latest/dev/virtualenvs/)):

```bash
$ git clone https://github.com/pudo/aleph.git
$ cd aleph
$ pip install -r requirements.txt
$ pip install -e .
$ bower install
```

Before continuing, please make sure that you have created a PostgreSQL database for ``aleph`` using the UTF-8 encoding, and that an instance of ElasticSearch is available. If you do not have a database set up, you can usually create it like this:

```bash
$ createdb -E utf-8 aleph
```

To configure ``aleph``, copy the configuration file template from ``contrib/docker_settings.py`` to a local path (such as ``settings.py``) and adapt them to suit your local environment. This includes setting up database and search index settings, outbound SMTP email settings, as well as OAuth and AWS credentials (see the ``docker`` section above). You must also make sure that the environment variable ``ALEPH_SETTINGS`` is set to the absolute path of the configuration file.

After setting up the configuration, you can create the database schema and search index like this:

```bash
$ aleph upgrade
```

Most errors in this command will be due to an invalid configuration, please be sure you have the configuration fully set up, database server and index running and all environment variables set.

When the database has been created, you can run a development HTTP server on localhost like this:

```bash
$ aleph runserver
```

Other commands (used to crawl and ingest data, or manage the system) will be explained in the Usage section below.

### Running the tests

To run the test harness for ``aleph``, the application must use actual versions of a PostgreSQL database and an ElasticSearch index. These can be configured by making a copy of the ``test_settings.py.tmpl`` file to ``test_settings.py`` and editing it to match your local configuration. You must then set the environment variable ``ALEPH_TEST_SETTINGS`` to point to the absolute path of that settings file.

When the settings are available, run:

```bash
$ make test
```

## Usage

``aleph`` has a number of ways for ingesting data. These are controlled via the command line utility by the same name, usually from inside the ``worker`` container.

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

## Existing alternatives

``aleph`` is one of many document processing and search tools targeted at journalists, activists etc. Many of these are similar in scope, ``aleph`` aims to distinguish itself by providing entity cross-referencing and seamless support for both tabular and textual data.

* [DocumentCloud](https://github.com/documentcloud), the biggest document hosting site for journalistic content, including OCR and organisation- and project-level access control.
* [Transparency Toolkit](https://github.com/TransparencyToolkit), LookingGlass is an indexing server for JSON documents with support for theming, used mainly for scraped social media profiles.
* [resourcecontracts.org](https://github.com/developmentseed/rw-contracts), visual browser for resource (oil, mining, etc.) contract documents.
* [mma-dexter](https://github.com/Code4SA/mma-dexter), used by Media Monitoring Africa to do content classification and guided entity extraction of South African media.
* [analice.me](https://github.com/hhba/mapa76), document management and data extraction tool by Hacks/Hackers Buenos Aires. 
* [datawi.re](https://github.com/pudo/datawi.re)
* [ICIJ Extract](https://github.com/icij/extract), Java-based OCR and content extraction pipeline used for large-scale leaks.
* [nltk](http://www.nltk.org/), [patterns](http://www.clips.ua.ac.be/pattern)
* [OpenCalais](http://www.opencalais.com/), LingPipe, AlchemyAPI

## License

The MIT License (MIT)

Copyright (c) 2014-2016 Friedrich Lindenberg

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
