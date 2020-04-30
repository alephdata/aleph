KEYCLOAK_DOCKER_NAME=aleph_keycloak_1

create-realm:
	docker exec -it $(KEYCLOAK_DOCKER_NAME) /bin/bash -c "/bin/bash /usr/local/bin/keycloak-create-realm.sh"

shell:
	docker exec -it $(KEYCLOAK_DOCKER_NAME) /bin/bash
