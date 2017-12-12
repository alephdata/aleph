from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan

es = Elasticsearch()
index = 'aleph-entity-v1'

q = {
    'query': {
        'match_all': {}
    },
    '_source': ['names']
}

for row in scan(es, index=index, query=q):
    source = row.get('_source')
    for name in source.get('names', []):
        print row.get('_id'), name
