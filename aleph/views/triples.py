from urlparse import urljoin
from banal import ensure_list
from followthemoney import model
from elasticsearch.helpers import scan
from rdflib import Namespace, Graph, URIRef, Literal
from rdflib.namespace import FOAF, DC, DCTERMS, RDF, RDFS, SKOS, XSD

from aleph.core import es
from aleph.settings import APP_UI_URL

DCMI = Namespace('http://purl.org/dc/dcmitype/')
FTM = Namespace('https://data.occrp.org/ns/ftm#')
ALEPH = Namespace('https://data.occrp.org/ns/aleph#')


def types_mapping():
    mapping = {}
    ps = model.properties
    for p in ps:
        mapping[p.name] = p.to_dict().get('type')
    return mapping

FTM_TYPES = types_mapping()


def entity_uri(value):
    return URIRef(urljoin(APP_UI_URL, 'entities/%s' % value))


def document_uri(value):
    return URIRef(urljoin(APP_UI_URL, 'documents/%s' % value))


def collection_uri(value):
    return URIRef(urljoin(APP_UI_URL, 'collections/%s' % value))


def tel_uri(value):
    return URIRef('tel:%s' % value)


def email_uri(value):
    return URIRef('mailto:%s' % value)


def country_uri(value):
    return URIRef('iso-3166-1:%s' % value)


def date_lit(value):
    return Literal(value, datatype=XSD.dateTime)


def typed_object(predicate, value):
    t = FTM_TYPES[predicate]
    if t == 'date':
        return date_lit(value)
    if t == 'country':
        return country_uri(value)
    if t == 'email':
        return email_uri(value)
    if t == 'phone':
        return tel_uri(value)
    if t == 'url':
        return URIRef(value)
    if t == 'entity':
        return entity_uri(value)
    else:
        return Literal(value)


def ns_bind(g):
    # NS binding useful for dumping to n3 for human readability but not
    # necessary for ntriples
    g.namespace_manager.bind('dc', DC)
    g.namespace_manager.bind('dcmi', DCMI)
    g.namespace_manager.bind('dct', DCTERMS)
    g.namespace_manager.bind('ftm', FTM)
    g.namespace_manager.bind('aleph', ALEPH)


def set_type(g, uri, entity):
    for schema in entity['schemata']:
        g.add((uri, RDF.type, FTM[schema]))


def set_collection(g, entity_uri, collection_uri):
    g.add((entity_uri, DCTERMS.isPartOf, collection_uri))
    g.add((collection_uri, DCTERMS.hasPart, entity_uri))


def set_entity_properties(g, uri, entity):
    if entity.get('name'):
        g.add((uri, SKOS.prefLabel, Literal(entity.get('name'))))
    for name in entity.get('names', []):
        g.add((uri, RDFS.label, Literal(name)))

    for country in entity.get('countries', []):
        if len(country) != 2:
            continue
        g.add((uri, ALEPH.country, country_uri(country)))

    for phone in entity.get('phones', []):
        g.add((uri, ALEPH.phone, tel_uri(phone)))

    for email in entity.get('emails', []):
        g.add((uri, ALEPH.email, email_uri(email)))

    properties = entity.get('properties', {})
    for name, values in properties.items():
        pred = FTM[name]
        for value in ensure_list(values):
            obj = typed_object(name, value)
            g.add((uri, pred, obj))


def set_document_properties(g, uri, document):
    if document.get('title'):
        g.add((uri, DC.title, Literal(document.get('title'))))
    if document.get('author'):
        g.add((uri, DC.creator, Literal(document.get('author'))))
    if document.get('retreived_at'):
        g.add((uri, ALEPH.retrievedAt, date_lit(document.get('retreived_at'))))
    g.add((uri, ALEPH.fileName, Literal(document.get('file_name'))))
    g.add((uri, ALEPH.sourceUrl, URIRef(document.get('source_url'))))
    g.add((uri, ALEPH.mediaType, Literal(document.get('mime_type'))))
    g.add((uri, DCTERMS.modified, date_lit(document.get('updated_at'))))

    # TODO: parents/children


def export_entity(f, entity, collection_uri):
    g = Graph()

    if 'Document' in entity['schemata']:
        uri = document_uri(entity['id'])
        set_document_properties(g, uri, entity)
    else:
        uri = entity_uri(entity['id'])

    set_entity_properties(g, uri, entity)
    set_type(g, uri, entity)
    set_collection(g, uri, collection_uri)

    # ns_bind(g)
    # print g.serialize(format='n3')
    f.write(g.serialize(format='ntriples'))


def export_collection(f, collection):
    uri = collection_uri(collection['id'])
    g = Graph()

    g.add((uri, RDF.type, DCMI.Collection))
    g.add((uri, RDFS.label, Literal(collection['label'])))
    g.add((uri, ALEPH.foreignId, Literal(collection['foreign_id'])))
    g.add((uri, ALEPH.category, ALEPH[collection['category']]))

    # ns_bind(g)
    # print g.serialize(format='n3')
    f.write(g.serialize(format='ntriples'))

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
        export_entity(f, entity, uri)

    return g


def export_collections(f):

    q = {
        'query': {'match_all': {}},
        'size': 9999
    }
    res = es.search(index='aleph-collection-v1', body=q)
    for hit in res['hits']['hits']:
        collection = hit['_source']
        collection['id'] = hit['_id']
        # collection['id'] = 38
        export_collection(f, collection)
