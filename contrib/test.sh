psql -c "DROP DATABASE IF EXISTS aleph_test;" $ALEPH_DATABASE_URI
psql -c "CREATE DATABASE aleph_test;" $ALEPH_DATABASE_URI

export ALEPH_PASSWORD_LOGIN=true
nosetests --with-coverage --cover-package=aleph --cover-erase
