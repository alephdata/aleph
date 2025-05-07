FROM node:23-slim AS builder

RUN mkdir /alephui
WORKDIR /alephui

COPY package.json /alephui
COPY package-lock.json /alephui

RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /alephui/build /assets
