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
`http://lvh.me:13376/api/1/sessions/callback/google`.
Save the client ID and the client secret as `ALEPH_OAUTH_*` values.

Finally you will need to provide a value for the `ALEPH_SECRET_KEY`. A good
example of a value is the output of `openssl rand -hex 24`.

## Development installation steps

Insider the Aleph repository you will find a `Docker` and a
`docker-compose.yml` files. These are used to build a container with the
application and start the relevant services.

To proceed run:

 1. `docker-compose up` to start the application and relevant services. You can
    leave this open to have access to the development logs.
 2. `docker-compose run app python aleph/manage.py init -s analyzers` to run
    the latest database migrations and create/update any indexes.
 3. Open `http://lvh.me:13376/` in your browser and proceed with the login.

Your repository is mounted inside the docker container under the name
`aleph_app_1`. You should also see the other Aleph services, `aleph_worker_1`
and `aleph_beat_1`. You can access these services anytime by running
`docker-compose run <app|worker|beat> bash`.

### Running tests

To run the tests, assuming you already have the `docker-compose` up and ready,
run `docker-compose run app make test`.

This will create a new database and run all the tests.
