# Running memorious and aleph together

**For development purposes** this is for running memorious and aleph both locally to test crawler submission to a non-live aleph API.

Update the `memorious` service in `docker-compose.yml` to point to local copy of memorious and crawlers. You need a `Dockerfile` in there (see [memorious docs](http://memorious.readthedocs.io/en/latest/installation.html)).

Configure env etc.

Run (with the `docker-compose` in this directory), and create a user in aleph:

```
$ (host) docker-compose up -d
$ (host) docker-compose run worker /bin/bash
$ (worker) aleph createuser --is_admin=True user1
```

Copy the API key returned and add it to memorious config for `ALEPH_API_KEY`.

Run memorious container. You may need to pip install memorious and/or crawlers depending on your memorious Dockerfile..

```
$ (host) docker-compose run memorious /bin/bash
$ (memorious) memorious list
$ ..
```
