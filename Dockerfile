FROM node:latest

RUN mkdir /alephui
WORKDIR /alephui
COPY package.json /alephui
RUN npm --quiet --silent install .

COPY . /alephui

RUN npm run build
