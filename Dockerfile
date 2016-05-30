FROM pudo/aleph-base:1.0
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive

# Begin python festivities
COPY requirements.txt /tmp/requirements.txt
RUN pip install -q --upgrade pip && pip install -q functools32 \
  && pip install -q -r /tmp/requirements.txt

COPY . /aleph
WORKDIR /aleph
ENV ALEPH_SETTINGS /aleph/contrib/docker_settings.py
RUN pip install -q -e /aleph
RUN rm -rf /aleph/.git && bower --allow-root --quiet install
