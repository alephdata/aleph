#!/bin/sh

# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

#docker-compose -f docker-compose.yml up -d --scale convert-document=6 --scale worker=6

docker-compose -f docker-compose.yml up -d 
