# Usage

Aleph main features are available through the web interface. Data loading
and other maintenance operations are provided via command line tools.
In order to understand the concepts and how it works, please refer to
the chapters bellow.

## Use cases

Below are some of common use cases Aleph was designed to cover. To learn more
about the needs of such a tool, please refer to the notes about the page on
[user needs in investigative journalism](http://www.influencemapping.org/workshop/user_needs.html).

There's also a [glossary](glossary.md) describing the keywords used in Aleph.

Consider some common use-cases like:

* As a journalist, I want to combine different types of facets which
  represent document and entity metadata.
* As a journalist, I want to see a list of documents that mention
  a person/org/topic so that I can sift through the documents.
* As a journalist, I want to intersect sets of documents that mention multiple
  people/orgs/topics so that I can drill down on the relationships between
  them.
* As a data importer, I want to routinely crawl and import documents
  from many data sources, including web scrapers, structured sources and
  filesystems.
* As a data importer, I want to associate metadata with documents
  and entities so that users can browse by various facets.

## Crawling data

One way to get the data into Aleph is to provide files and folders it can crawl
and load the content to the database.

### From files and folders

Aleph provide a tool to process all the files and folders using an input path.
Some files such as archives (ZIP packages or Tarfiles) will be treated as as
_virtual_ folders and all their content will be imported under its name.

It is important to note that this method of loadig data provides very limited
ways of including metadata (ex.: document titles, source URLs or document
languages). To overcome this, read about [Metafolders](#metafolders).

To use this tool, run

```bash
docker-compose run app python aleph/manage.py crawldir <DIRECTORY|FILE PATH>
```

Some extra parameters to specify the language and the country are also
available.

It is important to mention that importing the same directory
multiple times will not duplicate the source files as long as the base path of
the crawl is identical. The base path of the file is used to identify the
document source.

### From SQL

This method was removed in Aleph 1.1 to make place for future graph loaders.
The new loaders will provide support for this feature.

If you are interested in bringing this feature back, please get in touch with
us. The code is still available and can be packaged as a plugin.

### Metafolders

Is a format developed for Aleph to bulk-import many documents while retaining
relevant metadata. It can be used in scrapers and data cleaning scripts.
Aleph provides also the tools to work with the format and process Metafolder
files.

Metafolder files can be generated easily using the Python
[metafolder](https://github.com/alephdata/metafolder) library, and
the [krauler](https://github.com/alephdata/krauler) web crawling/scraping tool.

For the metafolder items to be loaded it is important to include the
information on the document source which they are to be associated with.

An example with minimal metadata is available below. To learn more about metadata
fields available in Aleph, please check the [Glossary](glossary.md#metadata).

```json
{
  "title": "Document title (not required)",
    "collection": {
      "label": "The Banana Republic Leaks",
      "foreign_id": "banana:republic"
    }
}
```

Now this folder can be loaded using:

```bash
docker-compose run app python aleph/manage.py metafolder <YOUR METAFOLDER PATH>
```
