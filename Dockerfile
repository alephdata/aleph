FROM alephdata/base:1.2
MAINTAINER Friedrich Lindenberg <friedrich@pudo.org>
ENV DEBIAN_FRONTEND noninteractive

RUN pip install -q --upgrade pip && pip install -q --upgrade setuptools
COPY requirements.txt requirements-docs.txt requirements-testing.txt /tmp/
RUN pip install -q -r /tmp/requirements.txt \
  && pip install --pre -q -r /tmp/requirements-docs.txt

COPY . /aleph
WORKDIR /aleph
RUN pip install -q -e .
RUN pip install --upgrade git+https://github.com/alephdata/ingestors.git#egg=ingestors

EXPOSE 8000
CMD gunicorn -w 5 -b 0.0.0.0:8000 --name aleph_gunicorn \
  --log-level info --log-file /var/log/gunicorn.log \
  aleph.manage:app
