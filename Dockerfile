FROM node:latest
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>

COPY . /alephui
WORKDIR /alephui
RUN npm --quiet --silent install .

RUN npm run build
