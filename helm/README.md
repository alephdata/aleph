# Helm Charts for Aleph

This repository contains helm charts to install Aleph and its microservices in a Kubernetes cluster.

## Configurations

The chart is in `charts/aleph` directory. It's configuration options are listed in its [README](charts/aleph/README.md)

## Releases

The charts are released into the helm repo located at [https://aleph-helm-charts.storage.googleapis.com/](https://aleph-helm-charts.storage.googleapis.com/)

## Pre and Post-Installation Steps

Before installing Aleph through the helm chart, some secrets have to be created. These secrets will contain AWS keys, Aleph's secret key, GCE service accounts etc for example.

After the installation is complete, an ingress has to be configured to make Aleph accessible outside the k8s cluster.

An example set up can be found in the `examples/kind` directory where we set up Aleph on a local Kubernetes cluster using [KIND (Kubernetes IN Docker)](https://kind.sigs.k8s.io/).

## Installation

Add the helm repo:
```
helm repo add aleph https://aleph-helm-charts.storage.googleapis.com
helm repo update
```

Install Aleph:
```
helm install aleph aleph/aleph -f values.yaml
```