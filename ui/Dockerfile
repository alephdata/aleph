FROM node:16-slim

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq -y update \
    && apt-get -qq -y install python build-essential
    
RUN mkdir /alephui
WORKDIR /alephui

COPY .npmrc /alephui/.npmrc
COPY tsconfig.json /alephui/tsconfig.json
COPY package.json /alephui

RUN npm install

COPY i18n /alephui/i18n
COPY public /alephui/public
RUN cp /alephui/node_modules/pdfjs-dist/build/pdf.worker.min.js /alephui/public/static/
COPY src /alephui/src

ENV REACT_APP_API_ENDPOINT /api/2/
# RUN npm run build
