FROM node:22-slim

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq -y update && apt-get -qq -y install rsync

RUN mkdir /alephui
WORKDIR /alephui

COPY .prettierrc /alephui/.prettierrc
COPY tsconfig.json /alephui/tsconfig.json
COPY package.json /alephui
COPY package-lock.json /alephui
COPY craco.config.js /alephui

RUN npm install
RUN cp -R /alephui/node_modules/ /node_modules

COPY i18n /alephui/i18n
COPY public /alephui/public
COPY src /alephui/src

ENV REACT_APP_API_ENDPOINT /api/2/
# RUN npm run build
