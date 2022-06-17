# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

KEYCLOAK_DOCKER_NAME := $(shell docker ps | grep _keycloak_1 | awk '{print $$NF}')

create-realm:
	echo "Keycloak docker name = $(KEYCLOAK_DOCKER_NAME)"
	docker exec -it $(KEYCLOAK_DOCKER_NAME) /bin/bash -c "/bin/bash /usr/local/bin/keycloak-create-realm.sh"

shell:
	docker exec -it $(KEYCLOAK_DOCKER_NAME) /bin/bash
