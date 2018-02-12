FROM alephdata/platform:2.0.3

# Install Python dependencies
COPY requirements-generic.txt /tmp/
RUN pip install -r /tmp/requirements-generic.txt && rm -rf /root/.cache
COPY requirements-toolkit.txt /tmp/
RUN pip install -r /tmp/requirements-toolkit.txt && rm -rf /root/.cache

# Install aleph
COPY . /aleph
WORKDIR /aleph
ENV PYTHONPATH /aleph
RUN cd /usr/local/lib/python2.7/site-packages && python /aleph/setup.py develop

# Run the green unicorn
CMD gunicorn -w 5 -b 0.0.0.0:8000 --name aleph_gunicorn \
  --log-level info --log-file /var/log/gunicorn.log \
  aleph.manage:app
