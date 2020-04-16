FROM elasticsearch:7.6.2

RUN bin/elasticsearch-plugin install --batch discovery-gce
RUN bin/elasticsearch-plugin install --batch repository-s3
RUN bin/elasticsearch-plugin install --batch repository-gcs
RUN bin/elasticsearch-plugin install --batch analysis-icu

COPY k8s-entrypoint.sh /k8s-entrypoint.sh
COPY synonames.txt /usr/share/elasticsearch/config/
RUN chown elasticsearch /usr/share/elasticsearch/config/synonames.txt

ENTRYPOINT [ "/k8s-entrypoint.sh" ]