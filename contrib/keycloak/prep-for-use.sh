#!/bin/bash

# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

cp docker-compose.dev-keycloak.yml ../../
sed -i 's/docker-compose.dev.yml/docker-compose.dev-keycloak.yml/g' ../../Makefile
