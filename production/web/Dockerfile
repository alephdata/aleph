FROM alephdata/ui AS builder
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /alephui/build /assets