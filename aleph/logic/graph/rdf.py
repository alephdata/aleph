import logging
from followthemoney import model
from followthemoney.types import registry
from rdflib import Namespace, Graph, URIRef, Literal
from rdflib.namespace import DCTERMS, RDF, RDFS, SKOS

from aleph.model import Document
from aleph.index.entities import iter_entities
from aleph.logic.util import ui_url

DCMI = Namespace('http://purl.org/dc/dcmitype/')
ALEPH = Namespace('https://alephdata.github.io/aleph/terms#')

log = logging.getLogger(__name__)


def itergraph(graph):
    nt = graph.serialize(format='nt')
    for line in nt.splitlines():
        if len(line):
            yield line
            yield b'\n'


def export_entity(entity, collection_uri):
    proxy = model.get_proxy(entity)
    g = Graph()
    uri = registry.entity.rdf(proxy.id)
    g.add((uri, DCTERMS.isPartOf, collection_uri))
    g.add((collection_uri, DCTERMS.hasPart, uri))
    if 'properties' not in entity:
        entity.update(Document.doc_data_to_schema(entity))
    if proxy.caption:
        g.add((uri, SKOS.prefLabel, Literal(proxy.caption)))
    for link in proxy.links:
        triple = link.rdf()
        if triple is not None:
            g.add(triple)
    return g


def export_collection(collection):
    uri = URIRef(ui_url('collections', collection.id))
    g = Graph()
    g.add((uri, RDF.type, DCMI.Collection))
    g.add((uri, RDFS.label, Literal(collection.label)))
    g.add((uri, DCMI.identifier, Literal(collection.foreign_id)))
    g.add((uri, ALEPH.category, ALEPH[collection.category]))
    yield from itergraph(g)

    entities = iter_entities(collection_id=collection.id, excludes=['text'])
    for entity in entities:
        g = export_entity(entity, uri)
        yield from itergraph(g)
