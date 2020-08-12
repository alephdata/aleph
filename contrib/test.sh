#!/bin/sh

psql -c "DROP DATABASE IF EXISTS aleph_test;" $ALEPH_DATABASE_URI
psql -c "CREATE DATABASE aleph_test;" $ALEPH_DATABASE_URI

mypy --ignore-missing-imports --no-implicit-optional ./aleph
nosetests --with-coverage --cover-package=aleph --cover-erase
