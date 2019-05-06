FROM node:12 AS builder

RUN mkdir /alephui
WORKDIR /alephui
COPY package.json /alephui
RUN npm install .

COPY .npmrc /alephui/.npmrc
COPY i18n /alephui/i18n
COPY public /alephui/public
COPY scripts /alephui/scripts
COPY config /alephui/config
COPY src /alephui/src
ENV REACT_APP_API_ENDPOINT /api/2/
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /alephui/build /assets
