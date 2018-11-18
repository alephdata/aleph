#!/bin/bash

# Set memlock limit
ulimit -l unlimited

# Call original entrypoint script
exec /docker-entrypoint.sh "${@}"