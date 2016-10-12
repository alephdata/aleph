FROM code4sa/aleph-python-base

COPY . /aleph
WORKDIR /aleph
ENV ALEPH_SETTINGS /aleph/contrib/docker_settings.py
RUN pip install -q -e /aleph
RUN rm -rf /aleph/.git && bower --allow-root --quiet install
