FROM pudo/aleph-base:1.7
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive
ENV ALEPH_SETTINGS /aleph/contrib/docker_settings.py

COPY . /aleph
WORKDIR /aleph

RUN pip install -q --upgrade pip \
  && pip install -q --upgrade setuptools \
  && pip install -q -r /aleph/requirements.txt

RUN pip install --pre -q -r /aleph/requirements-docs.txt
RUN pip install -q -e . && npm --quiet --silent install .
RUN touch aleph/static/style/_custom.scss && \
    ./node_modules/webpack/bin/webpack.js --env.prod
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

EXPOSE 8000

CMD gunicorn -w 5 -b 0.0.0.0:8000 --name aleph_gunicorn \
  --log-level info --log-file /var/log/gunicorn.log \
  aleph.manage:app
