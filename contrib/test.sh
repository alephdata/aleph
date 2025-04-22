#!/bin/sh

psql -c "DROP DATABASE IF EXISTS aleph_test;" $ALEPH_DATABASE_URI
psql -c "CREATE DATABASE aleph_test;" $ALEPH_DATABASE_URI

PYTHONDEVMODE=1 PYTHONTRACEMALLOC=1 pytest aleph/ --cov=aleph --cov-report html --cov-report term $@
