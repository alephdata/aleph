.. epigraph::

  Truth cannot penetrate a closed mind. If all places in the universe are in
  the Aleph, then all stars, all lamps, all sources of light are in it, too.

  -- `The Aleph <http://www.phinnweb.org/links/literature/borges/aleph.html>`_,
  Jorge Luis Borges

.. figure:: https://api.travis-ci.org/alephdata/aleph.png
   :target: https://travis-ci.org/alephdata/aleph/
   :alt: Build Status

**Aleph** is a tool for indexing large amounts of both unstructured (PDF, Word,
HTML) and structured (CSV, XLS, SQL) data for easy browsing and search. It is
built with investigative reporting as a primary use case. Aleph allows
cross-referencing mentions of well-known entities (such as people and
companies) against watchlists, e.g. from prior research or public datasets.

Here's some key features:

* Web-based UI for search across large document and data sets.
* Watchlist editor for making custom sets of entities to be tracked.
* Equal support for structured (i.e. tabular) and unstructured (i.e. textual)
  sources.
* Importers include a local filesystem traverser, web crawlers and a SQL query
  importer.
* Document entity tagger (regular expressions-based, and optionally using NLP).
* Support for OCR, unpacking Zip/RAR/Tarballs, language and encoding detection.
* Entity watchlist importers for `OpenSanctions <http://opensanctions.org/>`_.
* OAuth authorization and access control on a per-source and per-watchlist
  basis.

Documentation
-------------

The documentation for Aleph is `available on our Wiki
<https://github.com/alephdata/aleph/wiki>`_. If you wish to run your own
copy of Aleph (or contribute to the development), get started with the
`installation documentation <https://github.com/alephdata/aleph/wiki/Installation>`_.

Support
-------

Aleph is used by multiple organisations, including Code for Africa, OCCRP and
OpenOil. For coordination, the following mailing list exists:
`aleph-search <https://groups.google.com/forum/#!forum/aleph-search>`_

If you find any errors or issues using Aleph please
`file an issue on GitHub <https://github.com/alephdata/aleph/issues/new>`_ or
contact the mailing list.
