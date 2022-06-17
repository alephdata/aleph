.. SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
.. SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
..
.. SPDX-License-Identifier: MIT

Setting up Aleph with Traefik, Minio and keycloak.
--------------------------------------------------

Some Tips
---------

* Be sure to follow the instructions for a normal install as well as using
these config files.

* shell into aleph and run 'aleph upgrade' to create the needed database
structures.

* In the keycloak configuration set HTML Display name￼and Frontend URL to
your keycloak dns domain with /auth/ after it.

* Keycloak account-console under clients needs to be 
https://your-auth-domain/auth/realms/aleph-users/account/

* Keycloak aleph-ui under clients needs to be https://your-aleph-domain/

* Keycloak security-admin-console under clients needs to be https://your-auth-domain/auth/admin/aleph-users/console/

* Use minio client on exposed minio port on localhost to create the aleph bucket
if you have trouble with S3. Otherwise leave it alone.

Misc
----
There is a start and stop script included. 
