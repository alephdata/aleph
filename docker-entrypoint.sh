#!/bin/bash
# vim:sw=4:ts=4:et

set -e

entrypoint_log() {
    if [ -z "${ALEPH_ENTRYPOINT_QUIET_LOGS:-}" ]; then
        echo "$@"
    fi
}

file_env() {
    local var="$1"
    local fileVar="${var}_FILE"
    local def="${2:-}"

    if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
        echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
        exit 1
    fi
    local val="$def"
    if [ "${!var:-}" ]; then
        val="${!var}"
    elif [ "${!fileVar:-}" ]; then
        val="$(<"${!fileVar}")"
    fi
    export "$var"="$val"
    unset "$fileVar"
}

# servicelayer
file_env "AWS_SECRET_ACCESS_KEY"
file_env "ARCHIVE_ENDPOINT_URL"
file_env "REDIS_URL"

# aleph
file_env "ALEPH_SECRET_KEY"
file_env "ALEPH_DATABASE_URI"
file_env "FTM_STORE_URI"
file_env "ALEPH_ELASTICSEARCH_URI"
file_env "ALEPH_OAUTH_SECRET"
file_env "ALEPH_MAIL_PASSWORD"


# extra entrypoints
if [ "$1" = "gunicorn" ] || [ "$1" = "aleph" ]; then
    if /usr/bin/find "/docker-entrypoint.d/" -mindepth 1 -maxdepth 1 -type f -print -quit 2>/dev/null | read v; then
        entrypoint_log "$0: /docker-entrypoint.d/ is not empty, will attempt to perform configuration"

        entrypoint_log "$0: Looking for shell scripts in /docker-entrypoint.d/"
        find "/docker-entrypoint.d/" -follow -type f -print | sort -V | while read -r f; do
            case "$f" in
            *.env.sh)
                if [ -x "$f" ]; then
                    entrypoint_log "$0: Sourcing $f"
                    . "$f"
                else
                    # warn on shell scripts without exec bit
                    entrypoint_log "$0: Ignoring $f, not executable"
                fi
                ;;
            *.sh)
                if [ -x "$f" ]; then
                    entrypoint_log "$0: Launching $f"
                    "$f"
                else
                    # warn on shell scripts without exec bit
                    entrypoint_log "$0: Ignoring $f, not executable"
                fi
                ;;
            *) entrypoint_log "$0: Ignoring $f" ;;
            esac
        done

        entrypoint_log "$0: Configuration complete; ready for start up"
    else
        entrypoint_log "$0: No files found in /docker-entrypoint.d/, skipping configuration"
    fi
fi

exec "$@"
