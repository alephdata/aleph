#!/bin/bash

# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

cp docker-compose.dev-keycloak.yml ../../
sed -i 's/docker-compose.dev.yml/docker-compose.dev-keycloak.yml/g' ../../Makefile
