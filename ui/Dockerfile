FROM node:23-slim
ENV DEBIAN_FRONTEND noninteractive

RUN mkdir /alephui
WORKDIR /alephui

COPY package.json /alephui
COPY package-lock.json /alephui

RUN npm ci
COPY . .

ENV REACT_APP_API_ENDPOINT /api/2/
