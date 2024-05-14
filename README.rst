.. epigraph::

  Truth cannot penetrate a closed mind. If all places in the universe are in
  the Aleph, then all stars, all lamps, all sources of light are in it, too.

  -- `The Aleph <http://www.phinnweb.org/links/literature/borges/aleph.html>`_,
  Jorge Luis Borges

**Aleph** is a tool for indexing large amounts of both documents (PDF, Word,
HTML) and structured (CSV, XLS, SQL) data for easy browsing and search. It is
built with investigative reporting as a primary use case. Aleph allows
cross-referencing mentions of well-known entities (such as people and
companies) against watchlists, e.g. from prior research or public datasets.

For further details on the software, how to use it, install it or manage data
imports, please check the documentation at: 

* https://docs.aleph.occrp.org
* Installation: https://docs.aleph.occrp.org/developers/installation


Support
-------

Aleph is used and developed by multiple organisations and interested individuals.
If you're interested in participating in this process, please read the support
policy (`SUPPORT.md`), the contribution rules (`CONTRIBUTING.md`), and the code of conduct (`CODE_OF_CONDUCT.md`) and then get
in touch:

* https://docs.aleph.occrp.org/get-in-touch

Aleph Development
---------------
If you're looking to get involved with the development of Aleph, please check the `CONTRIBUTING.md` file for details on how to get started.

⚠️ **IMPORTANT** ⚠️ 
The default branch in this GitHub repository is "develop". The develop branch contains unreleased, unstable code. For stable releases, please check out the `list of releases <https://github.com/alephdata/aleph/releases>`_ or switch to the `main branch <https://github.com/alephdata/aleph/tree/main>`_.
----

Release process
---------------

If you are interested in, or have been tasked with releasing a new version of Aleph. The following steps should be followed:

Overview
--------

The basic process for releasing Aleph is this:

1. Check internal libraries for updates and merge. Release our libraries in the following order
  1. servicelayer
  2. followthemoney
  3. ingest-file
  4. react-ftm
2. Ensure that all libraries for a release are up to date in aleph and merged to the develop branch.
3. Ensure that any features, bugfixes are merged into develop and that all builds are passing
4. Ensure that the CHANGELOG.md file is up to date on the develop branch. Add information as required.
5. Create a RC release of Aleph.
6. Test and verify the RC. Perform further RC releases as required.
7. Merge all changes to main
8. Create a final version of Aleph

As far as possible apply the rules of semantic versioning when determining the type of release to perform.

Technical process
-----------------

RC releases
-----------

If you need to perform an RC release of Aleph, follow these steps:

1. Ensure that the `CHANGELOG`` is up to date on the develop branch and that all outstanding PR's have been merged
2. From the develop branch run bump2version (major, minor, patch) this will create a x.x.x-rc1 version of aleph
3. push the tags to the remote with git push --tags
4. push the version bump with git push
5. If there are problems with the RC you can fix them and use bump2version build to generate new rc release


Major, minor, patch releases
----------------------------

1. switch to `main` and pull from remote
2. If not already done merge `develop` into `main`
3. Update translations using `make translate` 
4. If you get npm errors, go into the ui folder and run `npm install`
5. commit translations to `main` and push to remote
6. run `bump2version --verbose --sign-tags release`. Note that bump2version won't show changes when you make the change, but it will work (see `git log` to check)
7. push the tags to the remote with `git push --tags`
8. push version bump to remote with `git push`
9. merge `main` back into `develop`. Slightly unrelated to the release process but this is a good time to do it so that the new version numbers appear in `develop` as well
