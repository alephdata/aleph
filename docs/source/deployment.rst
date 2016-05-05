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
     * postgresql-devel
     * libxml2-dev
     * libxslt-dev
     * python-dev

   * Aleph needs to bind to an instance of:

     * postgreSQL  [DATABASE_URL]
     * elasticsearch [BONSAI_URL]
     * rabbitmq [RABBITMQ_BIGWIG_URL]

1. Install python virtualenv::

   $ sudo pip install virtualenv

2. In the home directory, create a new virtualenv and activate it::

   $ virtualenv env
   $ source alephvenv/bin/activate

3. In the home directory, pull aleph source code and navigate into aleph::

   $ git clone https://github.com/codeforafrica/aleph
   $ cd aleph

4. Install python dependencies::

   $ pip install -r requirements.txt

5. Install aleph::

   $ pip install -e .

6. Install nodejs, npm, bower: See `installation instructions <https://nodejs.org/en/download/package-manager/#enterprise-linux-and-fedora>`_

7. Install web components::

   $ bower install

8. Configure environment variables in `/env/bin/activate` ::

   $ export DATABASE_URL="postgresql://<username>:<passwd>@<host>/<db>"
   $ export ARCHIVE_PATH=/home/aleph/archive
   $ export ALEPH_SETTINGS="/home/aleph/aleph/aleph/default_settings.py"
   $ export RABBITMQ_BIGWIG_URL="amqp://<user>:<password>@<amqp-host>/<name>"
   $ export TESSDATA_PREFIX=/usr/local/share/
   $ export SECRET_KEY=<oauth-secret>
   $ export BONSAI_URL="http://<es-host>:9200"

9. Run ElasticSearch and Postgres engines

10. Create `aleph` postgres user(assuming admin user is `postgres`) ::

    $ createdb -E utf-8 aleph -U postgres

11. Create index `aleph` on elasticsearch::

    $ curl -XPUT "http://<es-host>:9200/aleph"

12. Create search index and database::

    $ aleph upgrade

13. Run tests with nose::

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

  




