.. figure:: https://api.travis-ci.org/pudo/aleph.png
   :alt: Build Status

.. epigraph::

  Truth cannot penetrate a closed mind. If all places in the universe are in
  the Aleph, then all stars, all lamps, all sources of light are in it, too.

  -- `The Aleph <http://www.phinnweb.org/links/literature/borges/aleph.html>`_,
  Jorge Luis Borges

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
* Entity watchlist importers for
  `OpenNames <http://pudo.org/material/opennames/>`_ and
  `Investigative Dashboard <https://investigativedashboard.org/>`_.
* OAuth authorization and access control on a per-source and per-watchlist
  basis.
* Excel export for search result sets.

Documentation
-------------

The documentation for Aleph is available at
`aleph.readthedocs.io <http://aleph.readthedocs.io/>`_.
Feel free to edit the source files in the ``docs`` folder and send pull
requests for improvements.

Support
-------

Aleph is used by multiple organisations, including Code for Africa, OCCRP and
OpenOil. For coordination, the following mailing list exists:
`aleph-search <https://groups.google.com/forum/#!forum/aleph-search>`_

If you find any errors or issues using Aleph please
`file an issue on Github <https://github.com/pudo/aleph/issues/new>`_ or
contact the mailing list.
