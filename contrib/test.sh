#!/bin/sh

psql -c "DROP DATABASE IF EXISTS aleph_test;" $ALEPH_DATABASE_URI
psql -c "CREATE DATABASE aleph_test;" $ALEPH_DATABASE_URI

pytest aleph/tests/test_entities_api.py -k entity_tags --cov=aleph --cov-report html --cov-report term $@
