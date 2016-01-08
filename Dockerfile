FROM pudo/aleph-base:latest
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive

COPY requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install functools32 \
  && pip install -r /tmp/requirements.txt

COPY . /aleph
WORKDIR /aleph
ENV ALEPH_SETTINGS /aleph/contrib/docker_settings.py
RUN pip install -e /aleph
RUN rm -rf .git && bower --allow-root install
