FROM pudo/aleph-base:1.8
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ARG DEBIAN_FRONTEND=noninteractive

COPY . /aleph
WORKDIR /aleph

RUN make install

EXPOSE 8000
CMD gunicorn -w 5 -b 0.0.0.0:8000 --name aleph_gunicorn \
  --log-level info --log-file /var/log/gunicorn.log \
  aleph.manage:app
