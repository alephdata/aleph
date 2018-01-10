from urlparse import urljoin
from elasticsearch.helpers import scan
from rdflib import Namespace, Graph, URIRef, Literal
from rdflib.namespace import FOAF, DC, DCTERMS, RDF, RDFS, XSD

from aleph.core import es
from aleph.settings import APP_UI_URL

FTM = Namespace('https://data.occrp.org/ns/ftm#')
ALEPH = Namespace('https://data.occrp.org/ns/aleph#')
DCMI = Namespace('http://purl.org/dc/dcmitype/')


def setup_graph(uri):
    g = Graph(identifier=uri)
    g.namespace_manager.bind('dc', DC)
    g.namespace_manager.bind('dcmi', DCMI)
    g.namespace_manager.bind('dct', DCTERMS)
    g.namespace_manager.bind('ftm', FTM)
    g.namespace_manager.bind('aleph', ALEPH)

    return g


def set_type(g, uri, entity):
    for schema in entity['schemata']:
        g.add((uri, RDF.type, FTM[schema]))


def set_collection(g, entity_uri, collection_uri):
    g.add((entity_uri, DCTERMS.isPartOf, collection_uri))
    g.add((collection_uri, DCTERMS.hasPart, entity_uri))


def set_entity_properties(g, uri, entity):
    pass


def set_document_properties(g, uri, document):
    if document.get('title'):
        g.add((uri, DC.title, Literal(document.get('title'))))
    if document.get('author'):
        g.add((uri, DC.creator, Literal(document.get('author'))))
    if document.get('retreived_at'):
        g.add((uri, ALEPH.retrievedAt, Literal(
            document.get('retreived_at'), dataype=XSD.dateTime)))
    g.add((uri, ALEPH.fileName, Literal(document.get('file_name'))))
    g.add((uri, ALEPH.mimeType, Literal(document.get('mime_type'))))
    g.add((uri, ALEPH.sourceUrl, Literal(document.get('source_url'))))
    g.add((uri, DCTERMS.modified, Literal(
        document.get('updated_at'), datatype=XSD.dateTime)))

    # TODO: parents/children


def export_entity(g, entity, collection_uri):

    if 'Document' in entity['schemata']:
        uri = URIRef(urljoin(APP_UI_URL, 'documents/%s' % entity['id']))
        set_document_properties(g, uri, entity)
    else:
        uri = URIRef(urljoin(APP_UI_URL, 'entities/%s' % entity['id']))

    set_entity_properties(g, uri, entity)
    set_type(g, uri, entity)
    set_collection(g, uri, collection_uri)


def export_collection(collection):
    collection_uri = URIRef(urljoin(APP_UI_URL, 'collections/%s' %
                                    collection['id']))
    g = setup_graph(collection_uri)

    g.add((collection_uri, RDF.type, DCMI.Collection))
    g.add((collection_uri, RDFS.label, Literal(collection['label'])))
    g.add((collection_uri, ALEPH.foreignId, Literal(collection['foreign_id'])))
    g.add((collection_uri, ALEPH.category, ALEPH[collection['category']]))

    q = {
        'query': {
            'term': {'collection_id': collection['id']}
        },
        '_source': {
            'exclude': ['text']
        }
    }
    for row in scan(es, index='aleph-entity-v1', query=q):
        entity = row['_source']
        entity['id'] = row['_id']
        export_entity(g, entity, collection_uri)

    print g.serialize(format='n3')
    return g


def export_collections():
    out = ""

    q = {
        'query': {'match_all': {}},
        'size': 9999
    }
    res = es.search(index='aleph-collection-v1', body=q)
    for hit in res['hits']['hits']:
        collection = hit['_source']
        collection['id'] = hit['_id']
        g = export_collection(collection)

        out = out + g.serialize(format='ntriples')

    return out
