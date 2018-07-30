import logging
from banal import ensure_list
from followthemoney import model
from elasticsearch.helpers import scan
from rdflib import Namespace, Graph, URIRef, Literal
from rdflib.namespace import DC, DCTERMS, RDF, RDFS, SKOS, XSD

from aleph.core import es
from aleph.model import Document
from aleph.index.core import entities_index
from aleph.index.util import unpack_result
from aleph.logic.util import ui_url

# DC = Namespace('http://purl.org/dc/elements/1.1/format')
DCMI = Namespace('http://purl.org/dc/dcmitype/')
FTM = Namespace('https://w3id.org/ftm#')
ALEPH = Namespace('https://alephdata.github.io/aleph/terms#')

log = logging.getLogger(__name__)


def entity_uri(value):
    return URIRef(ui_url('entities', value))


def document_uri(value):
    return URIRef(ui_url('documents', value))


def collection_uri(value):
    return URIRef(ui_url('collections', value))


def phone_uri(value):
    return URIRef('tel:%s' % value)


def email_uri(value):
    return URIRef('mailto:%s' % value)


def country_uri(value):
    return URIRef('iso-3166-1:%s' % value)


def date_lit(value):
    return Literal(value, datatype=XSD.dateTime)


def itergraph(graph):
    nt = graph.serialize(format='nt')
    for line in nt.splitlines():
        if len(line):
            yield line
            yield '\n'


def export_entity_properties(g, uri, entity):
    properties = entity.get('properties', {})
    schema = model.get(entity.get('schema'))
    for name, prop in schema.properties.items():
        for value in ensure_list(properties.get(name)):
            if prop.type_name == 'date':
                obj = date_lit(value)
            if prop.type_name == 'country':
                obj = country_uri(value)
            if prop.type_name == 'email':
                obj = email_uri(value)
            if prop.type_name == 'phone':
                obj = phone_uri(value)
            if prop.type_name == 'url':
                obj = URIRef(value)
            if prop.type_name == 'entity':
                obj = entity_uri(value)
            else:
                obj = Literal(value)
            g.add((uri, FTM[name], obj))


def export_document_properties(g, uri, document):
    if document.get('title'):
        g.add((uri, DC.title, Literal(document.get('title'))))
    if document.get('author'):
        g.add((uri, DC.creator, Literal(document.get('author'))))
    if document.get('retrieved_at'):
        g.add((uri, ALEPH.retrievedAt, date_lit(document.get('retrieved_at'))))
    if document.get('file_name'):
        g.add((uri, ALEPH.fileName, Literal(document.get('file_name'))))
    if document.get('source_url'):
        g.add((uri, DC.source, URIRef(document.get('source_url'))))
    if document.get('parent'):
        parent_uri = document_uri(document.get('parent', {}).get('id'))
        g.add((uri, DC.isPartOf, parent_uri))
        g.add((parent_uri, DC.hasPart, uri))
    g.add((uri, DC.format, Literal(document.get('mime_type'))))
    g.add((uri, DCTERMS.modified, date_lit(document.get('updated_at'))))


def export_entity(entity, collection_uri):
    g = Graph()
    schemata = ensure_list(entity['schemata'])

    if Document.SCHEMA in schemata:
        uri = document_uri(entity['id'])
        export_document_properties(g, uri, entity)
    else:
        uri = entity_uri(entity['id'])
        export_entity_properties(g, uri, entity)

    g.add((uri, DCTERMS.isPartOf, collection_uri))
    g.add((collection_uri, DCTERMS.hasPart, uri))

    if entity.get('name'):
        g.add((uri, SKOS.prefLabel, Literal(entity.get('name'))))

    for schema in schemata:
        g.add((uri, RDF.type, FTM[schema]))

    for name in ensure_list(entity.get('names')):
        g.add((uri, ALEPH.name, Literal(name)))

    for country in ensure_list(entity.get('countries')):
        g.add((uri, ALEPH.country, country_uri(country)))

    for language in ensure_list(entity.get('languages')):
        g.add((uri, DCMI.language, Literal(language)))

    for phone in ensure_list(entity.get('phones')):
        g.add((uri, ALEPH.phone, phone_uri(phone)))

    for email in ensure_list(entity.get('emails')):
        g.add((uri, ALEPH.email, email_uri(email)))

    return g


def export_collection(collection):
    uri = collection_uri(collection.id)
    g = Graph()

    g.add((uri, RDF.type, DCMI.Collection))
    g.add((uri, RDFS.label, Literal(collection.label)))
    g.add((uri, DCMI.identifier, Literal(collection.foreign_id)))
    g.add((uri, ALEPH.category, ALEPH[collection.category]))

    for line in itergraph(g):
        yield line

    q = {'term': {'collection_id': collection.id}}
    q = {
        'query': q,
        '_source': {'exclude': ['text']}
    }
    for row in scan(es, index=entities_index(), query=q):
        g = export_entity(unpack_result(row), uri)
        for line in itergraph(g):
            yield line
