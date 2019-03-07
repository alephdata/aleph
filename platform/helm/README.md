# Usage

This is work in progress, do not use yet.

- Create DB instance
- Add database user and database
- Create K8s cluster

## Install tiller on server

`kubectl create -f core/helm.yaml`
`helm init --service-account tiller`

## Create namespace

`kubectl create -f core/namespace.yaml`

## Create service accounts and secrets

- `kubectl create secret generic service-account-app --from-file=service-account.json=/path/to/service-account.json -n aleph`
- `kubectl create secret generic service-account-db --from-file=service-account.json=/path/to/service-account.json -n aleph`
- `kubectl create secret generic common-secrets --from-literal=ALEPH_DATABASE_URI=postgresql://dbuser:dbpassword@db.aleph.svc.cluster.local/aleph --from-literal=ALEPH_SECRET_KEY=secretkey -n aleph`

## Install cert-manager prereqs

- `kubectl apply -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.6/deploy/manifests/00-crds.yaml`
- `kubectl label namespace default certmanager.k8s.io/disable-validation=true`

## Create a release

```bash
cd aleph
helm install release-name . --dep-up
```

## To upgrade a release

`helm upgrade release-name .`