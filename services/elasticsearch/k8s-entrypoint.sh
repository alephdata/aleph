#!/bin/bash

# Set memlock limit
# ulimit -l unlimited

mkdir -p /secrets
echo "create keystore"
/usr/share/elasticsearch/bin/elasticsearch-keystore create

# Do not run the following for-loop if /secrets is empty
shopt -s nullglob

for SECRETFILE in /secrets/*; do
    KEYNAME=$(basename $SECRETFILE);
    echo "$KEYNAME from $SECRETFILE";
    /usr/share/elasticsearch/bin/elasticsearch-keystore add-file $KEYNAME $SECRETFILE;
done

# Call original entrypoint script
exec /usr/local/bin/docker-entrypoint.sh "${@}"
