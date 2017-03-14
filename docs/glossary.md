# Glossary

Here is some of the vocabulary used by the application.

## Documents

These are the basic search results in Aleph. They can either be *text
documents* (in which case they are expected to have a number of pages and are
shown as a PDF in the user interface), or *tabular documents* (in which case
they can have multiple sheets, each with a number of records. They will be
shown as tables in the user interface).

## Collections

These are units documents and entity data used to group items in
Aleph. This can be the name of an imported directory, database, or something
more abstract, such as the name of an organisation or web site that has been
ingested. It can also be used to group documents and entities relevant to a
particular investigation.

## Foreign IDs

These exist both for documents and collections. They are a little
piece of text used to identify the origin of information, e.g. the URL of a
crawled document, or the path of an imported folder. Used to avoid duplicate
imports when importing the same content twice.

## Metafolder

Represents a format and tools to store a set of documents before
importing them into Aleph. It's benefit is storing [metadata](#metadata)
alongside the actual files that are to be imported, while separating
Aleph from previous workflow stages (e.g. the scraping of a web site).

Metafolders can be generated using the Python
[metafolder](https://github.com/alephdata/metafolder) library, and the
[krauler](https://github.com/alephdata/krauler) web crawling/scraping tool.

## Crawlers

Little plug-ins to the Aleph engine which import data into the system. The
included crawlers are very flexible, such as `DirectoryCrawler` or
`MetaFolderCrawler`, but specific crawlers can be programmed that will
import data from a specific source.

## Ingestors

Plug-ins to the Aleph engine which accept crawled
files and attempt to extract text pages or tabular rows from them so that
they can be imported into the system. Ingestors for common file formats like
Word documents, PDF files or CSV spreadsheets are included, but more exotic
types can be supported by programming additional ingestors.

## Analyzers

Is what Aleph runs after the documents have been ingested. They are used to
extract additional information from a document. Examples include the extraction
of entities and language detection. Again, new analyzers can be added through
the plug-in system.

## Plugins

To Aleph, plugins are Python classes in a Python distutils
package which are exposed via the `entry_points` mechanism. These include
crawlers, ingestors and analyzers. See `setup.py` in the repository root for
examples.

## Metadata

This is used to describe the content of individual documents in
Aleph.

Common metadata fields include:

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
* ``emails``: email addresses extracted from the text.
* ``headers``: a hash of the headers received upon download of the document via HTTP.
* ``content_hash``: a SHA-1 checksum of the data (automatically generated).

Other fields can be added, but they will not usually be shown in the user
interface.
