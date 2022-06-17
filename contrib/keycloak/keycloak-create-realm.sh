#!/bin/bash

# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

KC_BIN=/opt/jboss/keycloak/bin
REALM_NAME=aleph-users
CLIENT_ID=aleph-ui

${KC_BIN}/kcadm.sh get realms | grep -P "\"id\"\s*:\s*\"${REALM_NAME}\""
if [ "$?" != "0" ]; then
  echo "Authenticating..."
  until ${KC_BIN}/kcadm.sh config credentials --server http://localhost:8080/auth --realm master --user admin --password Pa55w0rd
  do
    sleep 10
  done
  echo "  Done."
  echo ""

  echo "Creating realm..."
  ${KC_BIN}/kcadm.sh create realms -s realm=${REALM_NAME} \
    -s "displayName=Aleph Users" \
    -s enabled=true \
    -o
  echo "  Done."
  echo ""

  echo "Creating client ${CLIENT_ID}..."
  ALEPH_UI_CID=$(${KC_BIN}/kcadm.sh create clients -r ${REALM_NAME} \
    -s clientId=${CLIENT_ID} \
    -s 'name=Aleph UI' \
    -s 'description=Client used by users authenticting from the Aleph UI.' \
    -s publicClient=true \
    -s 'redirectUris=["http://localhost:8080/*"]' \
    -i)
  echo "  Done - ID = ${ALEPH_UI_CID}."
  echo ""

  echo "Creating client superuser role..."
  ${KC_BIN}/kcadm.sh create clients/${ALEPH_UI_CID}/roles -r ${REALM_NAME} \
    -s name=superuser \
    -s 'description=User with superuser permissions within the Aleph application.'
  echo "  Done."
  echo ""

  echo "Creating aleph user..."
  ${KC_BIN}/kcadm.sh create users -r ${REALM_NAME} \
    -s username=aleph \
    -s email=aleph@mail.com \
    -s emailVerified=true \
    -s enabled=true
  ${KC_BIN}/kcadm.sh set-password -r ${REALM_NAME} --username aleph --new-password aleph
  echo "  Done."

  echo "Creating alephadmin user..."
  ${KC_BIN}/kcadm.sh create users -r ${REALM_NAME} \
    -s username=alephadmin \
    -s email=aleph.admin@mail.com \
    -s emailVerified=true \
    -s enabled=true
  ${KC_BIN}/kcadm.sh set-password -r ${REALM_NAME} --username alephadmin --new-password aleph
  ${KC_BIN}/kcadm.sh add-roles -r ${REALM_NAME} \
    --uusername alephadmin \
    --cclientid ${CLIENT_ID} \
     --rolename superuser
  echo "  Done."
else
  echo "Realm already configured."
fi
