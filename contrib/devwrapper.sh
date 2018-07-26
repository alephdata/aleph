#!/bin/bash

echo "Aleph environment is being set up: $(hostname -i)"

pip install -q -e /aleph
if [ -e "/aleph/site" ]; then
  echo 1>&2 "Using site package: 'site'."
  pip install -q -e /aleph/site
fi

exec "$@"
