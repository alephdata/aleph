#!/bin/bash
# vim:sw=4:ts=4:et

if [[ ${ALEPH_PAGES_ZIP+x} ]]; then
    curl -L -o /tmp/aleph-pages.zip "$ALEPH_PAGES_ZIP"
    unzip -o /tmp/aleph-pages.zip -d /tmp/aleph-pages/
    rm -rf /aleph/aleph/pages/*
    mv /tmp/aleph-pages/**/*.md /aleph/aleph/pages/
fi
