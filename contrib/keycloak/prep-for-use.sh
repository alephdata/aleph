#!/bin/bash

cp docker-compose.dev-keycloak.yml ../../
sed -i 's/docker-compose.dev.yml/docker-compose.dev-keycloak.yml/g' ../../Makefile
