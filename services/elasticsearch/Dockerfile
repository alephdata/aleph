FROM elasticsearch:7.0.0
RUN bin/elasticsearch-plugin install --batch discovery-gce
RUN bin/elasticsearch-plugin install --batch repository-s3
RUN bin/elasticsearch-plugin install --batch repository-gcs
RUN bin/elasticsearch-plugin install --batch analysis-icu
COPY k8s-entrypoint.sh /k8s-entrypoint.sh

ENTRYPOINT [ "/k8s-entrypoint.sh" ]