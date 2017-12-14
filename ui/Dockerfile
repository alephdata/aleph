FROM node:latest

RUN mkdir /alephui
WORKDIR /alephui
COPY package.json /alephui
RUN npm --quiet --silent install .

COPY .tx /alephui/.tx
COPY .npmrc /alephui/.npmrc
COPY i18n /alephui/i18n
COPY public /alephui/public
COPY src /alephui/src

# RUN npm run build
