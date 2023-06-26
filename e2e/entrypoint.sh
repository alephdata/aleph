#!/usr/bin/env sh

TIMEOUT="300"

date +"%c Waiting for up to $TIMEOUT seconds for $BASE_URL to be rechable"
./wait-for "$BASE_URL" --timeout="$TIMEOUT" -- && date +"%c $BASE_URL is up"
exec "$@"
