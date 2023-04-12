#!/usr/bin/env sh

TIMEOUT="300"

echo "Waiting for up to $TIMEOUT seconds for $BASE_URL to be rechable"
./wait-for "$BASE_URL" --timeout="$TIMEOUT" -- echo "$BASE_URL" is up
exec "$@"
