FROM docker.elastic.co/elasticsearch/elasticsearch-oss:6.5.4
RUN bin/elasticsearch-plugin install analysis-icu

COPY k8s-entrypoint.sh /k8s-entrypoint.sh
