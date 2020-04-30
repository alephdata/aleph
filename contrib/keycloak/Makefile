KEYCLOAK_DOCKER_NAME := $(shell docker ps | grep _keycloak_1 | awk '{print $$NF}')

create-realm:
	echo "Keycloak docker name = $(KEYCLOAK_DOCKER_NAME)"
	docker exec -it $(KEYCLOAK_DOCKER_NAME) /bin/bash -c "/bin/bash /usr/local/bin/keycloak-create-realm.sh"

shell:
	docker exec -it $(KEYCLOAK_DOCKER_NAME) /bin/bash
