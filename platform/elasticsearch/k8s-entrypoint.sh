#!/bin/bash

# Set memlock limit
ulimit -l unlimited

# Call original entrypoint script
exec /usr/local/bin/docker-entrypoint.sh "${@}"