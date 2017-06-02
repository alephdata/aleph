#!/bin/bash

echo "Aleph environment is being set up: $(hostname -i)"
if [ -d "/aleph/node_modules" ]; then
  echo 1>&2 "You have a local node_modules directory. Please delete this."
  exit 127
fi

if [ -f "/aleph/settings.py" ]; then
  echo 1>&2 "Found settings.py, adding to ALEPH_SETTINGS."
  export ALEPH_SETTINGS=/aleph/settings.py
fi

pip install -q -e /aleph
if [ -e "/aleph/site" ]; then
  echo 1>&2 "Using site package: 'site'."
  pip install -q -e /aleph/site
fi

exec "$@"
