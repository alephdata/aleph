<!--
SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc

SPDX-License-Identifier: MIT
-->

# Aleph in KIND

# Creating the local cluster

Create cluster

```
make create-infra
```

This creates a 7 node cluster named `alephlocal` using [`kind`](https://kind.sigs.k8s.io/). The configuration
of this cluster can be changed by editing [`kind-config.yml`](kind-config.yml)

# Creating namespaces

Create namespaces

```
kubectl create -f k8s/namespace.yaml
```

This creates 2 namespaces named `dev` and `staging` in the k8s cluster.

# Setting up kubectl contexts

Setup kubectl contexts

```
kubectl config set-context dev --namespace=dev --cluster=kind-alephlocal --user=kind-alephlocal
kubectl config set-context staging --namespace=staging --cluster=kind-alephlocal --user=kind-alephlocal
```

This creates 2 kubectl contexts named `dev` and `staging` which correspond to the 2 namespaces we created earlier.
We can operate within one particular namespace by activating the corresponding context.

To use one particular context:

```
kubectl config use-context staging
```

This activates the `staging` context and all our operations will affect the `staging` namespace unless we specify another namespace explicitly.

# Setting up backend services

Set up services like Redis, Postgres, es. Also installs MinIO as a local S3 alternative.

```
make create-services ENV=staging
```

This creates Redis, Postgresql and Elasticsearch services using helm. The config for each of these services can be tweaked by changing values in `values/*.yaml` files.

Wait until all the pods from these service have the status `Running`. This will take a few minutes. You can check their status by running

```
watch kubectl get pods -n staging
```

# Creating secrets

Some configurations like Aleph's secret key, authorized database url etc should be kept secrets. These files are
stored in `secrets/` directory. **The contents of this directory should be encrypted using [`git-crypt`](https://github.com/AGWA/git-crypt).**

Create secrets etc

```
make create-secrets ENV=staging
make create-service-accounts ENV=staging
```

If using Google services like storage, vision api, please save the service-account.json file to `secrets/$(ENV)/service-accounts/service-account-aleph.json`.

If using AWS services, please save the access key and secret key to `secrets/$(ENV)/aleph/AWS_ACCESS_KEY_ID` and `secrets/$(ENV)/aleph/AWS_SECRET_ACCESS_KEY_ID`.

# Install Aleph and included microservices

Install Aleph and related services using the helm charts in this repo:

```
helm install aleph ../../charts/aleph -f ./values/staging.yaml -n staging --timeout 10m0s
```

Or using the helm repository:

```
helm repo add aleph https://aleph-helm-charts.storage.googleapis.com
helm repo update
helm install aleph -f ./values/staging.yaml -n staging --timeout 10m0s aleph/aleph
```

Configuration values for Aleph can be changed in `values/$(ENV).yaml`

Checkout the [`README`](../../charts/aleph/README.md) for available options.

# Install nginx-ingress

Install ingress controller

```
make install-ingress
```

Install ingresses

```
kubectl apply -f k8s/ingress.dev.yaml
kubectl apply -f k8s/ingress.staging.yaml
```

You'll have to edit the hostnames and create appropriate DNS entries for the hostnames (in `/etc/hosts` in case of localhost).

# Set up port forwarding for MinIO

If using MinIO on a local cluster, you'll need to port forward the service to port 9000 and setup a `/etc/hosts` entry to make it accessible in the host machines browser to serve files directly.
