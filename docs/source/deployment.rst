Deployment
==========

Ideally, `aleph` is deployed in a containerized setup using Docker.

a basic understanding of `Docker` is necessary. `This <https://docker.wistia.com/medias/fqwm0x9tgz>`_ is a good place to start.

With Docker
------------

This is a `from scratch` guide for deploying aleph with docker.


Without Docker
---------------

This is a `from scratch` guide for deploying aleph components outside of a containerized setup.

.. note::

   * This step-by-step guide is performed on a CentOS 7 instance on GCP
   * Assumptions and pre-requisites:

     * System user: aleph
       (User `aleph` in /etc/sudoers)
     * Home folder: /home/aleph
     * Python2.7
     * Python package manager installed (pip or easy_install)
     * Git is installed
     * postgresql-devel  ( `postgresql-server-dev` on Ubuntu )
     * libxml2-dev
     * libxslt-dev
     * python-dev

   * Aleph needs to bind to an instance of:

     * postgreSQL (v.9.4 +) [DATABASE_URL]
     * elasticsearch (v.2.3.1) [BONSAI_URL]
     * rabbitmq [RABBITMQ_BIGWIG_URL]

1. Install python virtualenv::

   $ sudo pip install virtualenv

2. In the home directory, create a new virtualenv and activate it::

   $ virtualenv env
   $ source env/bin/activate

   Set up :doc:`configs`

3. In the home directory, pull aleph source code and navigate into aleph::

   $ git clone https://github.com/codeforafrica/aleph
   $ cd aleph

4. Install and set up tesseract (and its dependencies):  `Installation steps here <http://hanzratech.in/2015/01/16/ocr-using-tesseract-on-ubuntu-14-04.html>`_
   
   (Build may take a while...)


   
5. Install python dependencies::

   $ pip install -r requirements.txt

6. Install aleph::

   $ pip install -e .

7. Install nodejs, npm, bower: See `installation instructions <https://nodejs.org/en/download/package-manager/#enterprise-linux-and-fedora>`_

8. Install web components::

   $ npm install -g bower
   $ bower install

9. Configure environment variables in `/env/bin/activate` ::

   $ export DATABASE_URL="postgresql://<username>:<passwd>@<host>/<db>"
   $ export ARCHIVE_PATH=/home/aleph/archive
   $ export ALEPH_SETTINGS="/home/aleph/aleph/aleph/default_settings.py"
   $ export RABBITMQ_BIGWIG_URL="amqp://<user>:<password>@<amqp-host>/<name>"
   $ export TESSDATA_PREFIX=/usr/local/share/
   $ export BONSAI_URL="http://<es-host>:9200"
   $ export OAUTH_SECRET=wTEEOYW5b66EumjZ_XHNh4Yv
   $ export OAUTH_KEY=914424606018-68qjso1v76sath3t3pe639oo42qopddg.apps.googleusercontent.com


10. Run ElasticSearch and Postgres engines

11. Create `aleph` postgres user(assuming admin user is `postgres`) ::

    $ createdb -E utf-8 aleph -U postgres

12. Create index `aleph` on elasticsearch::

    $ curl -XPUT "http://<es-host>:9200/aleph"

13. Create search index and database::

    $ aleph upgrade

14. Build assets::

    $ aleph assets build

15. Run tests with nose::

    $ nosetests --with-coverage --cover-package=aleph --cover-erase



Common Deployment Issues
------------------------

* Aleph upgrade fails due to multiple heads::

  $ alembic.util.exc.CommandError: Multiple head revisions are present for given argument 'head'; please specify a specific target revision, '<branchname>@head' to narrow to a specific head, or 'heads' for all heads

  Solution:
  List out the heads using::
      
      $ aleph db heads

  Merge the heads::
      
      $ aleph db merge 1234 5678

  Run your upgrade::

      $ aleph upgrade

  




