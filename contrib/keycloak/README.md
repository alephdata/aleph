<!--
SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc

SPDX-License-Identifier: MIT
-->

# Aleph Development with Keycloak Authentication

The Docker compose configuration file `docker-compose.dev-keycloak.yml` mirrors
the `docker-compose.dev.yml` configuration, but includes two additional services

* `keycloak-postgres` - A PostgreSQL  instance that hosts the Keycloak database. 
* `keycloak` - Runs Keycloak and connects to the `keycloak-postgres` PostgreSQL
instance.

The configurations of these services are based on
[keycloak-postgres.yml](https://github.com/keycloak/keycloak-containers/blob/master/docker-compose-examples/keycloak-postgres.yml).
These two services are started when the `api` service is started. The `api`
environment is configured to use the Keycloak instance for OAuth authentication.

The Keycloak website is available at http://localhost:1580 once the instance is
running.

## Using the Keycloak Development Configuration

To use the Keycloak development configuration, the Aleph `Makefile` must be
updated to use the Keycloak Docker compose configuration file instead of the
default `docker-compose.dev.yml` file. To do this, from the `contrib/keycloak`
directory, run this command:

```bash
bash prep-for-use.sh
```

This script copies the `docker-compose.dev-keycloak.yml` file to the `aleph`
root and edits the `Makefile`'s compose command to use the
`docker-compose.dev-keycloak.yml` file. Once the `Makefile` has been updated,
it can be used the same as when using the normal development environment.

## Initializing Keycloak

After the Keycloak instance is started for the first time, the Keycloak realm,
client, roles, and users that Aleph is configured to use must be created. This
only needs to be done once for the instance.

To initialize Keycloak, after the the Keycloak instance has started, from the
root `aleph` directory, run

```bash
make -f contrib/keycloak/Makefile create-realm
```

This will run the `keycloak-create-realm.sh` script in the Keycloak instance.
This script creates the following within Keycloak:

* `aleph-users` realm
* `aleph-ui` client
* `superuser` client role within the `aleph-ui` client
* Users
  * `aleph` - Regular user
  * `alephadmin` - User with the `superuser` client role

## Keycloak User Information

After initializing Keycloak, the following users are created within Keycloak:

| User Name | Password | Realm | Description |
| --- | --- | --- | --- |
| admin | Pa55w0rd | master | Keycloak administrator user. |
| aleph | aleph | aleph-users | Regular aleph user. |
| alephadmin | aleph | aleph-users | Aleph user with the `superuser` client role. |

## Useful URLs

| URL | Description |
| --- | --- |
| [OpenID config](http://localhost:1580/auth/realms/aleph-users/.well-known/openid-configuration) |  Lists the Keycloak `aleph-users` OpenID client configuration, including endpoint URIs. |
| [End Keycloak user session](http://localhost:1580/auth/realms/aleph-users/protocol/openid-connect/logout) | Signing out of Aleph does not end the user's session in Keycloak, but going to this URL will. |