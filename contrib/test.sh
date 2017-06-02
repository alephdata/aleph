psql -c "DROP DATABASE IF EXISTS aleph_test;" $ALEPH_DATABASE_URI
psql -c "CREATE DATABASE aleph_test;" $ALEPH_DATABASE_URI

pip install -q -r requirements-testing.txt
nosetests --with-coverage --cover-package=aleph --cover-erase
