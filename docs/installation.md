# Installation

Aleph requires a couple of services in order to operate. To make it easier
for development and deployments it uses Docker containers. Below you will find
the installation steps on how to install Aleph locally for development and
production environment.

## Prerequisites

Before we continue, you will need to have Docker and `docker-compose`
installed. Please refer to their manual to learn how to set up
[Docker](https://docs.docker.com/engine/installation/) and [docker-compose](https://docs.docker.com/compose/install/).

You will also need to edit a configuration file to provide some credentials
for the external services. This includes the OAuth credentials to allow
Google users to login to Aleph and an email server credentials. Email server
support is optional for development purposes.

Inside the same repository you will find a file called `aleph.env.tmpl`.
This is a template of the configuration file. Make a copy of this file named
`aleph.env` and follow the steps below to edit it.

To get the OAuth credentials please visit the [Google Developers Console](https://console.developers.google.com/).
There you will need to [create an API key](https://support.google.com/googleapi/answer/6158862).
In the **Authorized redirect URIs** section, use this URL:
```
http://lvh.me:13376/api/1/sessions/callback/google
```
Save the client ID and the client secret as `ALEPH_OAUTH_*` values.

Finally you will need to provide a value for the `ALEPH_SECRET_KEY`. A good
example of a value is the output of `openssl rand -hex 24`.

## Development installation steps

Insider the Aleph repository you will find a `Dockerfile` and a
`docker-compose.dev.yml` files. These are used to build a container with the
application and start the relevant services.

To proceed run:

 1. `make build` to start the application and relevant services. You can
    leave this open to have access to the development logs.
 2. `make upgrade` to run the latest database migrations and create/update
    any indexes.
 3. Open `http://lvh.me:13376/` in your browser and proceed with the login.

Your repository is mounted inside the docker container under the name
`aleph_app`. You can access these services anytime by running
`make shell`.

### Building from a clean state

You can also build the Aleph images locally. This could be useful while working
on the Dockerfile changes and new dependency upgrades.

Aleph provides two commands to build the images. First one is `make base`, this
will build the `alephdata/base` image (this is an intermediary image with
system-level dependencies for Aleph). The second one is `make build`, this will
build the `alephdata/aleph` image (this will generate a production ready image).

## Front-end

Aleph is transitioning the front-end codebase towards a more modern
architecture and while this is still a work-in-progress, some of the features
already landed and should make the front-end development easier.

An LTS version of Node.js with NPM is required before we continue.
First you will need to install the development packages (at the moment the
build tool uses Webpack 2): `npm install .`.
If you are using Docker, none of this is required.

In order to build the front-end you will need to run: `make assets`.
The front-end assets are always built when you start the application.

If you are working on the front-end, you will need to start the assets
watcher in parallel:

```
make assets-dev
```

While working on the front-end development, make sure you disable browser
cache!

## Production deployment

Aleph runs on PostgreSQL and ElasticSearch along with a couple of system
tools like OpenOffice, ImageMagik, Tesseract and wkhtmltopdf. For a full list
of system dependencies please review the [`aleph_base`
Dockerfile](https://github.com/alephdata/aleph/blob/master/contrib/base/Dockerfile).

If you decide to not use Docker compose, you will have to provide all these
dependencies and services and change the configuration file accordingly.
An application only Docker image is also available at
[`alephdata/aleph`](https://hub.docker.com/r/alephdata/aleph/).

Finally, aleph is optimized to use certain Amazon Web Services: SQS and S3. To
enable AWS features, you will need to set the AWS key ID and access key in the
configuration file. Amazon SQS support is available for task queueing. Where
S3 is available for file uploads.

### Upgrading

Aleph does not provide automatic upgrades. You will have to download the new
version Docker images or checkout the latest version using Git first.

Once you have the latest version, you can run the command bellow to upgrade
the existing installation.

```
make upgrade
```

## Configuration

Most of the Aleph configuration is handled via a set of values in a Python
configuration file. The defaults are documented in the
[default_settings.py](https://github.com/alephdata/aleph/blob/master/aleph/default_settings.py)
file and can be overridden by creating a configuration file named
``settings.py`` in the aleph base directory.

While using Docker, the config file, in turn, is largely configured using
environment variables in accordance with [12 factor
principles](https://12factor.net/). These environment variables can be found also in
[docker_settings.py](https://github.com/alephdata/aleph/blob/master/contrib/docker_settings.py).

### Feature options

* ``TIKA_URI`` - when enabled, this will use Apache Tika to extract content
  from PDF files, rather than the built-in ``pdfminer`` and ``tesseract``
  modules. The URI must point to a Tika server endpoint, which is also
  responsible for handling OCR.

  **Note:** using Tika with OCR'd documents may yield
  different results from the built-in mechanism and OCR may not be performed
  on the same sections of a document's content
  (See: [#104](https://github.com/alephdata/aleph/issues/104)).

## Running tests

To run the tests, assuming you already have the `docker-compose` up and ready,
run `make test`.

This will create a new database and run all the tests.

The test settings can also be configured by making a copy of the
`test_settings.py.tmpl` file to `test_settings.py` and editing it to
match your configuration. You must then set the environment
variable ``ALEPH_TEST_SETTINGS`` to point to the absolute path of that
settings file.
