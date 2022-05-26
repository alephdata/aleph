#!/bin/sh

#docker-compose -f docker-compose.yml up -d --scale convert-document=6 --scale worker=6

docker-compose -f docker-compose.yml up -d 
