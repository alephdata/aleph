FROM elasticsearch:7.4.2

RUN bin/elasticsearch-plugin install --batch repository-s3 \
    && bin/elasticsearch-plugin install --batch repository-gcs \
    && bin/elasticsearch-plugin install --batch analysis-icu

COPY k8s-entrypoint.sh /k8s-entrypoint.sh
COPY --chown=elasticsearch synonames.txt /usr/share/elasticsearch/config/

ENTRYPOINT [ "/k8s-entrypoint.sh" ]