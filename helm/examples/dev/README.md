# Kubernetes Development Environment

The example in this directory shows how to install Aleph using Kubernetes on your development machine.

## Prerequisites

* You need to run a Kuberentes cluster on your development machine. A simple way to run a single-node Kubernetes cluster on Linux, macOS, and Windows is using Docker Desktop. Follow the steps outlined in the [Docker Desktop documentation](https://docs.docker.com/desktop/kubernetes/) to enable Kubernetes.

* If you’re already using the `kubectl` CLI with other clusters, make sure to switch to the `docker-dekstop` context:
  
  ```
  kubectl config use-context docker-desktop
  ```

* Running this example may require up to 8GB of memory, so make sure to [update the resource settings](https://docs.docker.com/desktop/settings/mac/#resources) in Docker Desktop if necessary.

* You also need Helm, a tool for packaging Kubernetes resources. Please refer to the [Helm documentation](https://helm.sh/docs/intro/install/) for instructions on how to install Helm on your machine.

## Installation

Once you have installed Helm and have a Kubernetes cluster running on your machine, follow the following steps to install Aleph and dependent services in your cluster.

### Create secrets

Some sensitive configuration options should be stored using Kubernetes secrets. These configuration options are stored in files in the `secrets` directory.

> [!IMPORTANT]  
> In a production setting, you have to encrypt the secret files, e.g. using [git-crypt](https://github.com/AGWA/git-crypt). Alternatively, you can configure an external service to retrieve secrets from. For more information, refer to [Secrets Best Practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/).

Use the `kubectl` CLI to create `Secret` objects based on the files in the `secrets` directory:

```
kubectl create secret generic aleph-secrets --from-file=./secrets/aleph
kubectl create secret generic postgresql-secrets --from-file=./secrets/postgresql
kubectl create secret generic minio-secrets --from-file=./secrets/minio
```

### Install services

Aleph depends on a number of services, including PostgreSQL and Elasticsearch. Installing Aleph before these services are available will cause errors. Run the following command to install all services required by Aleph, but not Aleph itself:

```
helm install --dependency-update --set "aleph.enabled=false" aleph .
```

This command downloads Helm charts for dependencies listed in the `Chart.yaml` file in this directory and installs everything in your local Kubernetes cluster, except for Aleph itself.

Once you’ve run the command above, you can run `watch kubectl get pods` to observe how Kubernetes pods for the multiple services are started. Wait until everything is running and ready.

### Install Aleph

Next, run the following command to install Aleph:

```
helm upgrade --set "aleph.enabled=true" aleph .
```

This will create all Kubernetes resources for Aleph itself and runs SQL and Elasticsearch migrations. This may take a few minutes.

### Open the Aleph UI

Wait until all pods are running and ready, then open `http://kubernetes.docker.internal` in your web browser. You should see the Aleph homepage.

> [!NOTE]
> Usually Docker Desktop should automatically add an entry to `/etc/hosts` to resolve `kubernetes.docker.internal`. If `kubernetes.docker.internal` can’t be resolved, you may need to manually add an entry to `/etc/hosts`:
>
> ```
> 127.0.0.1 kubernetes.docker.internal
> ```

## Upgrading

In order to upgrade your installation after you’ve made changes to the Aleph Helm chart run:

```
helm upgrade --set "aleph.enabled=true" --dependency-update aleph .
```
