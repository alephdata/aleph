# aleph [![Build Status](https://api.travis-ci.org/pudo/aleph.png)](https://travis-ci.org/pudo/aleph)

Sections: [Installation](#installation) | [Usage](#usage) | [Mailing list](#mailing-list) | [License](#license)

* * *

*Truth cannot penetrate a closed mind. If all places in the universe are in the Aleph, then all stars, all lamps, all sources of light are in it, too.* - [The Aleph](http://www.phinnweb.org/links/literature/borges/aleph.html), Jorge Luis Borges

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
$ mkdir -p /srv && cd /srv
$ git clone git@github.com:pudo/aleph.git
$ cd aleph
$ cp aleph.env.tmpl aleph.env
# edit the environment settings
$ docker-compose up -d
$ docker-compose run worker /bin/bash
# init the database (this will also delete it, hence the name):
root@worker# aleph upgrade
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

To configure ``aleph``, copy the configuration file template from ``contrib/docker_settings.py`` to a local path (e.g. ``settings.py``) and adapt it to suit your local environment. This includes setting up database and search index settings, outbound SMTP email settings, as well as OAuth and AWS credentials (see the ``docker`` section above).

You must also make sure that the environment variable ``ALEPH_SETTINGS`` is set to the absolute path of the configuration file.

After setting up the configuration, you can create the database schema and search index like this:

```bash
$ aleph upgrade
```

Most errors in this command will be due to an invalid configuration, please be sure you have the settings file prepared, database server and index running and all environment variables set.

Once the database has been created, you can run a development HTTP server on localhost like this:

```bash
$ aleph runserver
```

Visit [http://localhost:5000](http://localhost:5000) to try out the web application. Make sure to use ``gunicorn`` instead of the built-in web server to run the web interface in production.

Other commands (used to crawl and ingest data, or manage the system) will be explained in the Usage section below.

### Running the tests

To run the test harness for ``aleph``, the application must use a PostgreSQL database and an ElasticSearch index which will be deleted and re-initialized during each test run. Make sure to set these up separately from the ones you plan to use during normal operation.

The test settings can be configured by making a copy of the ``test_settings.py.tmpl`` file to ``test_settings.py`` and editing it to match your local configuration. You must then set the environment variable ``ALEPH_TEST_SETTINGS`` to point to the absolute path of that settings file.

When the settings are available, run:

```bash
$ make test
```

## Usage

End-users will use ``aleph`` via the web-based user interface, which is not covered here as it should be self-explanatory. In order to load data, delete loaded documents or perform other maintenance, though, command line tools are provided. These include several different methods of loading data from source directories, the web, or a SQL database.

When using ``docker``, the commands below should be run from within an instance of the ``worker`` container. An instance can be launched using the following command, which will result in a root shell inside the container:

```bash
$ docker-compose run worker /bin/bash
```

### A little aleph glossary

Before digging into the individual import methods for ``aleph``, here is some of the vocabulary used by the application.

* ***Documents*** are the basic search results in ``aleph``. They can either be *text documents* (in which case they are expected to have a number of pages and are shown as a PDF in the user interface), or *tabular documents* (in which case they can have multiple sheets, each with a number of records. They will be shown as tables in the user interface).
* ***Sources*** are units of content used to identify the origin of documents in aleph. This can be the name of an imported directory, or somethign more abstract, such as the name of an organisation or web site that has been ingested.
* ***Foreign IDs*** exist both for documents and sources. They are a little piece of text used to identify the origin of information, e.g. the URL of a crawled document, or the path of an imported folder. Used to avoid duplicate imports when importing the same content twice.
* ***Metadata*** is used to describe the content of individual documents in ``aleph``. Common metadata fields in ``aleph`` include:
	* ``title``: a short document title (will be extrapolated from the file name, if none is given).
	* ``summary``: an optional short description, usually less than 200 characters.
	* ``file_name``: the basename of the imported file, e.g. ``Source_Data.xlsx``. If not provided, this will be guessed from the ``source_url`` or ``source_path``)
	* ``foreign_id``: see above, e.g. a source URL, or foreign systems ID
	* ``extension``: e.g. ``pdf``, ``csv``, without the dot
	* ``mime_type``: e.g. ``text/csv``, ``application/pdf``
	* ``source_url``: e.g. ``http://source.com/documents/Source_Data.xlsx``
	* ``source_path``: local import path, e.g. ``/tmp/Source_Data.xlsx``
	* ``languages``: a list of lowercase two-letter ISO 3166-1 language codes, e.g ``['ja', 'en']``
	* ``countries``: a list of lowercase two-letter ISO country codes, e.g ``['jp', 'en']``
	* ``dates``: a list of ISO 8601 dates relevant to the document, eg. ``['2001-01-28']``
	* ``keywords``: a list of key phrases.
	* ``headers``: a hash of the headers received upon download of the document via HTTP.
	* ``content_hash``: a SHA-1 checksum of the data (automatically generated).

	Other fields can be added, but they will not usually be shown in the user interface.
* ***Metafolders*** are a mechanism to store a set of documents before importing them into ``aleph``. It's benefit is storing metadata (see above) alongside the actual files that are to be imported, while separating ``aleph`` from previous workflow stages (e.g. the scraping of a web site). Metafolders can be generated using the Python [metafolder](https://github.com/pudo/metafolder) library, and the [krauler](https://github.com/pudo/krauler) web crawling/scraping tool.
* ***Crawlers*** are little plug-ins to the ``aleph`` engine which import data into the system. The included crawlers are very flexible, such as ``SQLCrawler``, ``DirectoryCrawler`` or ``MetaFolderCrawler``, but specific crawlers can be programmed that will import data from a specific source.
* ***Ingestors*** are plug-ins to the ``aleph`` engine which accept crawled files and attempt to extract text pages or tabular rows from them so that they can be imported into the system. Ingestors for common file formats like Word documents, PDF files or CSV spreadsheets are included, but more exotic types can be supported by programming additional ingestors.
* ***Analyzers*** are run after the documents have been ingested. They are used to extract additional information from a document. Examples include the extraction of entities and language detection. Again, new analyzers can be added through the plug-in system.
* ***Plugins*** to ``aleph`` are Python classes in a Python distutils package which are exposed via the ``entry_points`` mechanism. They include crawlers, ingestors and analyzers. See ``setup.py`` in the repository root for examples.

### Loading data from a file or directory

It is easy for ``aleph`` to recursively traverse all files and directories in a given input directory. Some files, such as ZIP packages or Tarfiles will be treated as 'virtual' directories and their contents will be imported as well.

The downside of using directory crawling as an import method, however, is that it provides very limited ways of including metadata, such as document titles, source URLs or document languages. If such information is important to you, please consider using metafolders (see below).

```bash
$ docker-compose run worker /bin/bash

# Load all files from the given directory:
root@worker# aleph crawldir /srv/data/my_little_documents_folder

# Load an individual file:
root@worker# aleph crawldir /srv/data/my_file.doc

# Specify a language for all documents:
root@worker# aleph crawldir -l fr /srv/data/my_little_documents_folder/french

# Specify a country for all documents:
root@worker# aleph crawldir -c ca /srv/data/my_little_documents_folder/canadian
```

Importing the same directory multiple times will not duplicate the source files, as long as the base path of the crawl is identitcal (it is being used to identify the document source).

### Loading data from a metafolder

Metafolders (see glossary above) can be used to bulk-import many documents while retaining relevant metadata. It is important for [metafolder](https://github.com/pudo/metafolder) items  imported into ``aleph`` to include information on the document source which they are to be associated with. Thus, the minimal metadata for a metafolder item would look something like this:

```json
{
	"title": "Document title (not required)",
	"source": {
		"label": "The Banana Republic Leaks",
		"foreign_id": "banana:republic"
	}
}
```

Of course, other metadata (such as title, summary, languages, file types, etc.) can be included as well. Once these basic criteria are met, the import can be started via:

```bash
$ docker-compose run worker /bin/bash
root@worker# aleph metafolder /srv/data/my_meta_folder
```

#### Generating metafolders

Metafolder is a format developed for aleph, and thus there's a lack of applications creating them. One notable exception is [krauler](https://github.com/pudo/krauler) a simplistic web crawler which comes pre-installed with the default ``aleph`` docker container. It is usually configured using a YAML file and can be used to easily grab all of a web site, or (for example) all PDF files from a specific domain.

The Python [metafolder API](https://github.com/pudo/metafolder) is also very easy to use in more specific scripts. It can be used in scrapers and data cleaning scripts.

### Loading data from SQL databases

``aleph`` comes with a built-in method to import data from a SQL database, either by reading whole tables or the output of specific, pre-defined queries. In order to work with ``aleph's`` document pipeline, this process actually generates CSV files, which are then loaded into the system.

To configure the ``crawlsql`` command, you must create a query specification as a YAML file. This will contain information regarding the database connection, source tables and queries and additional metadata.

```yaml
# This can also be an environment variable, e.g. $DATABASE_URI
url: "postgresql://user:pass@hostnmae/database_name"
sources:
    my_source_foreign_id:
        label: "Source Label"
        # Specify metadata common to all documents from this source:
        meta:
            countries: ['de']
            languages: ['de']
        queries:
            my_document_foreign_id:
                table: my_source_table
                # Metadata specific to this document/query:
                meta:
                    title: "Whatever this table is about"
                    keywords:
                    	- stuff
                    	- misc
                # Do not include some of the columns:
                skip:
                  - id
                  - code
                  - sequence
            
            another_document_foreign_id:
          	   tables:
          	     - my_person_table
          	     - my_address_table
          	   joins:
          	   	  # It does not matter which is left or right
          	     - left: my_person_table.home_address_id
          	       right: my_address_table.id
          	   meta:
          	       title: "Query joined from two tables"
          	   skip:
          	       # requires qualified names now:
          	       my_person_table.home_address_id
```

Of course, you need to make sure that the docker container running the aleph import commands will be able to connect to the given database URI. You can run the following command to begin the import:

```bash
$ docker-compose run worker /bin/bash
root@worker# aleph crawlsql /path/to/spec.yml
```

### Loading well-known persons of interest

One of the key features of ``aleph`` is its ability to cross-reference imported documents and databases with the names of entities of interest, such as politicians or companies. While you can use the application itself to manage such collections, it may be useful to bootstrap 
the database using data from international sanctions and police search lists. Such data is provided by [OpenNames](http://pudo.org/material/opennames/) and can be imported in bulk:

```bash
$ docker-compose run worker /bin/bash
root@worker# aleph crawl opennames
```

Please note that importing entity collections requires re-indexing documents that match the given entity search terms. If you already have documents indexed, expect a significant amount of background activity following the import of the OpenNames collections.

### Developing a custom crawler

Custom crawlers are useful to directly import large amounts of data into the system. This can make sense for custom scrapers or crawlers where the indirection of using a metafolder is not desirable.

Crawlers are Python classes and exposed via the ``entry_point`` of a Python package. To develop a custom crawler, start by setting up a separate Python package from ``aleph`` with it's own ``setup.py`` ([learn more](https://python-packaging.readthedocs.org/en/latest/)).

A basic crawler will extend the relevant ``Crawler`` class from ``aleph`` and implement it's ``crawl()`` method:

```python
from aleph.crawlers.crawler import Crawler

class ExampleCrawler(Crawler):

    def crawl(self):
	    source = self.create_source(foreign_id='example', label='Example.com Documents')
	    for i in range(0, 1000):
		     meta = self.metadata()
	         meta.foreign_id = 'example-doc:%s' % i
             meta.title = 'Document Number %s' % i
             meta.mime_type = 'application/pdf'
             url = 'https://example.com/documents/%s.pdf' % i
             self.emit_url(source, meta, url)
```

Besides ``emit_url``, results can also be forwarded using the ``emit_file(source, meta, file_path)`` and ``emit_content(source, meta, content)`` methods. If a crawler creates collections, it can use ``emit_collection(collection, entity_search_terms)`` which will start a partial re-index of documents.

In order to make sure that ``aleph`` can find the new crawler, it must be added to the ``setup.py`` of your package:

```python
setup(
    name='mypackage',
    ...
    entry_points={
        'aleph.crawlers': [
            'example = mypackage.example:ExampleCrawler'
        ]
    }
)
```

Finally, you must ensure that the plugin package is installed in your ``aleph`` docker container, for example by extending the ``Dockerfile`` to include the plugin package. Once this is ready, run the crawler from inside the container:

```bash
$ docker-compose run worker /bin/bash
root@worker# aleph crawl example
```

### Other maintenance commands

``aleph`` also includes a set of command to perform a set of other maintenance operations. For starters, an admin can list all sources currently registered in the system:

```bash
$ docker-compose run worker /bin/bash
root@worker# aleph sources
```

To delete all documents in a given source, as well as the source itself, run:

```bash
$ docker-compose run worker /bin/bash
root@worker# aleph flush source_foreign_id
```

If you want to re-analyze or re-index all documents that are part of a given source, run:

```bash
$ docker-compose run worker /bin/bash

# Perform analysis (i.e. entity extraction, language detection) and index:
root@worker# aleph analyze -f source_foreign_id

# Re-index only:
root@worker# aleph analyze -f source_foreign_id
```

Finally, a pleasantly-named command is provided to delete and re-construct both the entire database and the search index.

```bash
$ docker-compose run worker /bin/bash
root@worker# aleph evilshit
```

## Mailing list

``aleph`` is used by multiple organisations, including Code for Africa, OCCRP and OpenOil. For coordination, the following Google Group exists: [aleph-search](https://groups.google.com/forum/#!forum/aleph-search)

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
