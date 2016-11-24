FROM pudo/aleph-base:1.5
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive
ENV ALEPH_SETTINGS /aleph/contrib/docker_settings.py

COPY . /aleph
WORKDIR /aleph

RUN pip install -q --upgrade pip \
  && pip install -q --upgrade setuptools \
  && pip install -q -r /aleph/requirements.txt

RUN rm -rf /aleph/.git \
  && pip install -q -e . \
  && bower --allow-root --quiet install

EXPOSE 8000

CMD gunicorn -w 5 -b 0.0.0.0:8000 --name aleph_gunicorn --log-level info --log-file /var/log/gunicorn.log aleph.manage:app
