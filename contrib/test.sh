psql -c "DROP DATABASE IF EXISTS aleph_test;" $ALEPH_DATABASE_URI
psql -c "CREATE DATABASE aleph_test;" $ALEPH_DATABASE_URI

export ALEPH_REGEX_ENTITIES=true
export ALEPH_PASSWORD_LOGIN=true
export ALEPH_PASSWORD_REGISTRATION=true

pip install -q -r requirements-testing.txt
nosetests --with-coverage --cover-package=aleph --cover-erase
