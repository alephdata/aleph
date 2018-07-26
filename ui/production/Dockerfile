FROM alephdata/aleph-ui AS builder
ENV REACT_APP_API_ENDPOINT /api/2/
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /alephui/build /assets
