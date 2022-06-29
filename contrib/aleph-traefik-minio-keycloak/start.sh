#!/bin/sh

# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

#docker-compose -f docker-compose.yml up -d --scale convert-document=6 --scale worker=6

docker-compose -f docker-compose.yml up -d 
