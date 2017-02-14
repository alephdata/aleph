# aleph [![Build Status](https://api.travis-ci.org/pudo/aleph.png)](https://travis-ci.org/pudo/aleph)

*Truth cannot penetrate a closed mind. If all places in the universe are in the Aleph, then all stars, all lamps, all sources of light are in it, too.* - [The Aleph](http://www.phinnweb.org/links/literature/borges/aleph.html), Jorge Luis Borges

``aleph`` is a tool for indexing large amounts of both unstructured (PDF, Word, HTML) and structured (CSV, XLS, SQL) data for easy browsing and search. It is built with investigative reporting as a primary use case. ``aleph`` allows cross-referencing mentions of well-known entities (such as people and companies) against watchlists, e.g. from prior research or public datasets.

Here's some key features:

* Web-based UI for search across large document and data sets.
* Watchlist editor for making custom sets of entities to be tracked.
* Equal support for structured (i.e. tabular) and unstructured (i.e. textual) sources.
* Importers include a local filesystem traverser, web crawlers and a SQL query importer.
* Document entity tagger (regular expressions-based, and optionally using NLP).
* Support for OCR, unpacking Zip/RAR/Tarballs, language and encoding detection.
* Entity watchlist importers for [OpenNames](http://pudo.org/material/opennames/) and 
  [Investigative Dashboard](https://investigativedashboard.org/).
* OAuth authorization and access control on a per-source and per-watchlist basis.
* Excel export for search result sets.
* Ability to generate graph representations of entity co-occurrence.

## Documentation

The documentation for aleph exists in [the project wiki](https://github.com/pudo/aleph/wiki). Please refer to:

* [Installation](https://github.com/pudo/aleph/wiki/Installation) with Docker and in development mode.
* [Usage](https://github.com/pudo/aleph/wiki/Usage) for loading data and maintaining the system.
* For a conceptual overview, refer to the [glossary](https://github.com/pudo/aleph/wiki/Glossary).

## Mailing list

``aleph`` is used by multiple organisations, including Code for Africa, OCCRP and OpenOil. For coordination, the following Google Group exists: [aleph-search](https://groups.google.com/forum/#!forum/aleph-search)

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

