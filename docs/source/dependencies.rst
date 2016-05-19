Dependencies
============


System
------
`aleph` has been tested on Ubuntu 14.04 on an AWS cloud.
It is however built to run on any Unix based platform that meets the dependencies listed below.

Service Integrations
----------------------

- PostgreSQL (tested with v.9.5.2)
- ElasticSearch
- RabbitMQ or Amazon SQS


Python libs
-----------
Most of the python dependencies are captured in `requirements.txt <https://github.com/CodeForAfrica/aleph/blob/master/requirements.txt>`_


Other dependencies
------------------

- Requirements for the web interface are captured on `bower.json <https://github.com/codeforafrica/aleph/blob/master/bower.json>`_
- Ruby-sass: ``apt-get install ruby-sass`` or ``gem install sass``



- Node.js and NPM
- bower::

  $ npm install -g bower

- uglifyjs::

  $ npm install -g uglifyjs

- Git::

  $ sudo yum install git

- pip::

  $ sudo easy_install pip

- python-lxml::

  $ sudo yum install python-lxml

- gcc::

  $ sudo yum install gcc

- postgresql-libs
- postgresql-devel
- libxml2-dev 
- libxslt-dev 
- python-dev
