from elasticsearch import Elasticsearch
from elasticutils import S
from docpipe import Task

MAPPED_DOC_TYPES = {}

es = Elasticsearch()
es_index = 'dit'


def make_query():
    return S().indexes(es_index)


def index_document(document):
    doc_type = document.collection.name

    # if document.collection.name not in MAPPED_DOC_TYPES:
    #     es.indices.create(index=es_index, ignore=400)
    #     #if es.indices.exists(index=es_index, doc_type=doc_type):
    #     es_mapping = es.indices.get_mapping(index=es_index,
    #                                         doc_type=doc_type)
    #     es_mapping = es_mapping.get(es_index, {}).get('mappings', {})
    #     if doc_type not in es_mapping:
    #         es_mapping = {doc_type: {}}
    #     #else:
    #     #    es_mapping = {doc_type: {}}
    #     es_mapping[doc_type]['_all'] = {'enabled': True}
    #     es_mapping = es.indices.put_mapping(index=es_index, doc_type=doc_type,
    #                                         body=es_mapping)
    #     MAPPED_DOC_TYPES[doc_type] = es_mapping

    es.index(index=es_index, doc_type=doc_type,
             body=document._store, id=document.content_id)


class IndexerTask(Task):

    def transform(self, document):
        index_document(document, self.config)
        
